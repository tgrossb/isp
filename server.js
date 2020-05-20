const { v4 } = require('uuid');
const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const Cards = require('./cards.js');

const port = process.env.PORT || 5000;
const prod = process.env.NODE_ENV === 'production'


const app = express();
app.use(express.static(path.join(__dirname, prod ? 'isp/build' : 'isp/public')));

const server = http.createServer(app)
server.listen(port, () => console.log('Listening on ' + port));

const io = socketIO(server);

let ids = new Map();
let gameCodes = new Array();
let games = new Map();
let users = new Map();

let cardDecks = new Cards();

io.on('connection', socket => {
	console.log("New user " + socket.id);

	socket.on("userSync", name => {
		socket.emit("gameCodesUpdated", gameCodes);

		if (!name)
			return;

		let user = userNamed(socket, name);

		if (user.currentRoom){
			socket.emit("gameUpdated", games.get(user.currentRoom));
			socket.emit("messagesUpdated", games.get(user.currentRoom).messages);
		}

		if (!games.get(user.currentRoom))
			return;

		let game = games.get(user.currentRoom);
		if (game.started){
			let locations = [];
			for (let p of game.players)
				locations.push(p.location);
			socket.emit("playersSquaresUpdated", locations)
			socket.emit("turnChanged", game.players[game.currentPlayer].id);
		}
	});


	socket.on('createGame', name => {
		let user = userNamed(socket, name);

		let gameCode = generateGameCode();
		gameCodes.push(gameCode);

		let game = {gameCode: gameCode, leaderId: user.id, started: false, won: false, players: [{
			id: user.id,
			name: user.name,
			location: 0,
			drew: false,
			rolled: false
		}], messages: [{message: user.name + " joined the game", senderName: 'Server'}]};
		games.set(gameCode, game);

		socket.join(gameCode);
		user.currentRoom = gameCode;
		socket.emit("gameJoined", {game: game, me: {uid: user.id, name: user.name}});
		io.emit("gameCodesUpdated", gameCodes);
	});

	socket.on('joinGame', params => {
		let user = userNamed(socket, params.name);

		let game = games.get(params.gameCode);
		game.players.push({id: user.id, name: user.name, location: 0, drew: false, rolled: false});
		game.messages.push({message: user.name + " joined the game", senderName: 'Server'});

		socket.join(params.gameCode);
		user.currentRoom = params.gameCode;

		socket.emit("gameJoined", {game: game, me: {uid: user.id, name: params.name}});
		io.to(params.gameCode).emit("gameUpdated", game);
		io.to(params.gameCode).emit("messagesUpdated", game.messages);
	});

	socket.on('sendMessage', message => {
		let name = ids.get(socket.id);
		let user = users.get(name);
		let messages = games.get(user.currentRoom).messages;
		messages.push({message: message, senderName: user.name});
		io.to(user.currentRoom).emit("messagesUpdated", messages);
	});

	socket.on('quitGame', () => {
		let name = ids.get(socket.id);
		let user = users.get(name);
		socket.leave(user.currentRoom);

		if (!games.has(user.currentRoom))
			return;

		let game = games.get(user.currentRoom);
		if (game.leaderId === user.id){
			io.to(user.currentRoom).emit('forceQuit');
			games.delete(user.currentRoom);
			gameCodes = gameCodes.filter((value, index, arr) => (value != user.currentRoom));
			io.emit("gameCodesUpdated", gameCodes);
		} else {
			game.players = game.players.filter((value, index, arr) => (value.id != user.id));
			game.messages.push({message: user.name + " left the game", senderName: 'Server'});
			io.to(user.currentRoom).emit("gameUpdated", game);
			io.to(user.currentRoom).emit("messagesUpdated", game.messages);
		}
	});

	socket.on('startGame', () => {
		let name = ids.get(socket.id);
		let user = users.get(name);
		let game = games.get(user.currentRoom);
		game.currentPlayer = 0;
		game.started = true;
		io.to(user.currentRoom).emit('gameStarted');
		io.to(user.currentRoom).emit("turnChanged", game.players[game.currentPlayer].id);
	});

	socket.on('rollDie', () => {
		let name = ids.get(socket.id);
		let user = users.get(name);
		let game = games.get(user.currentRoom);
		let pIndex = game.players.findIndex(p => (p.id === user.id));
		if (pIndex !== game.currentPlayer || game.won)
			return;

		if (!game.players[game.currentPlayer].rolled){
			let num = Math.floor(Math.random() * 6) + 1;
			io.to(user.currentRoom).emit("rollCompleted", num);
			game.players[pIndex].location = Math.min(game.players[pIndex].location + num, 61);
			game.players[pIndex].rolled = true;
		}
	});

	socket.on('requestPlayersSquares', () => {
		let name = ids.get(socket.id);
		let user = users.get(name);
		let game = games.get(user.currentRoom);

		let locations = [];
		for (let p of game.players)
			locations.push(p.location);

		socket.emit('playersSquaresUpdated', locations);
		checkWinner(game, locations);
	});

	socket.on('requestCard', () => {
		let name = ids.get(socket.id);
		let user = users.get(name);
		let game = games.get(user.currentRoom);
		if (!game.players[game.currentPlayer].rolled || game.won)
			return;

		if (!game.players[game.currentPlayer].drew){
			let cardKey = calcCardKey(game.players[game.currentPlayer].location);
			let card = cardDecks.getCard(cardKey);
			card.ownerId = game.players[game.currentPlayer].id;
			card.back = true;
			io.to(user.currentRoom).emit('cardServed', card);
			game.players[game.currentPlayer].drew = true;
		}
	});

	socket.on('flipCard', card => {
		let name = ids.get(socket.id);
		let user = users.get(name);
		let game = games.get(user.currentRoom);
		let pIndex = game.players.findIndex(p => (p.id === user.id));
		if (pIndex !== game.currentPlayer || game.won)
			return;

		card.back = false;
		io.to(user.currentRoom).emit('cardServed', card);

		game.players[game.currentPlayer].location = Math.max(Math.min(game.players[game.currentPlayer].location + card.offset, 61), 0);
		let locations = [];
		for (let p of game.players)
			locations.push(p.location);
		io.to(user.currentRoom).emit('playersSquaresUpdated', locations);
		checkWinner(game, locations);
	});

	socket.on('surrenderTurn', () => {
		let name = ids.get(socket.id);
		let user = users.get(name);
		let game = games.get(user.currentRoom);
		let pIndex = game.players.findIndex(p => (p.id === user.id));
		if (pIndex !== game.currentPlayer || game.won)
			return;

		io.to(user.currentRoom).emit('cardServed', {present: false, offset: 0});

		game.currentPlayer = (game.currentPlayer+1) % game.players.length;
		game.players[game.currentPlayer].rolled = false;
		game.players[game.currentPlayer].drew = false;
		io.to(user.currentRoom).emit('turnChanged', game.players[game.currentPlayer].id);
	})
});

function checkWinner(game, locations){
	let winnerIndex = locations.findIndex(loc => (loc == 61));
	if (winnerIndex === -1)
		return;
	let winnerName = game.players[winnerIndex].name;
	io.to(game.gameCode).emit("winner", winnerName);
}

function userNamed(socket, name){
	if (!users.has(name))
		users.set(name, {id: v4(), name: name, currentRoom: ''});

	let user = users.get(name);
	ids.set(socket.id, name);
	if (user.currentRoom)
		socket.join(user.currentRoom);

	return user;
}

function generateGameCode(){
	let randCode;
	do
		randCode = ("000000" + Math.floor(Math.random() * 1000000)).slice(-6);
	while (gameCodes.includes(randCode))
	return randCode;
}

function calcCardKey(index){
	if (index <= 0)
		return -1;

	index--;
	if (index < 20)
		return Math.floor(index/5);
	index -= 20;
	if (index < 16)
		return Math.floor(index/4);
	index -= 16;
	if (index < 12)
		return Math.floor(index/3);
	index -= 12;
	if (index < 8)
		return Math.floor(index/2);
	index -= 8;
	if (index < 4)
		return index;

	return 4;
}
