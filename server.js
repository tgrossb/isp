const { v4 } = require('uuid');
const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

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
	});


	socket.on('createGame', name => {
		let user = userNamed(socket, name);

		let gameCode = generateGameCode();
		gameCodes.push(gameCode);

		let game = {gameCode: gameCode, leaderId: user.id, players: [{
			id: user.id,
			name: user.name,
			location: 0
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
		game.players.push({id: user.id, name: user.name, location: 0});
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
});

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
