const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const Database = require('./database.js');
const database = new Database();

const port = process.env.PORT || 5000;
const prod = process.env.NODE_ENV === 'production'


const app = express();
app.use(express.static(path.join(__dirname, prod ? 'isp/build' : 'isp/public')));

const server = http.createServer(app)
server.listen(port, () => console.log('Listening on ' + port));

const io = socketIO(server);

let ids = new Map();

io.on('connection', socket => {
	console.log("New user " + socket.id);

	socket.on("userSync", async name => {
		let gameCodes = await database.getGameCodes();
		socket.emit("gameCodesUpdated", gameCodes);

		if (!name)
			return;

		let {id, currentRoom} = await userNamed(socket, name, true);

		if (currentRoom){
			let game = await database.getGame(currentRoom);
			socket.emit("gameUpdated", game);
			socket.emit("messagesUpdated", game.messages);
		}
	});


	socket.on('createGame', async name => {
		let uid = await userNamed(socket, name);

		let gameCodes = await database.getGameCodes();
		let gameCode = generateGameCode(gameCodes);

		let game = await database.createGame(gameCode, uid, name);
		gameCodes = await database.getGameCodes();

		socket.join(gameCode);
		ids.get(socket.id).gameCode = gameCode;
		socket.emit("gameJoined", {game: game, me: {uid: uid, name: name}});
		io.emit("gameCodesUpdated", gameCodes);
	});

	socket.on('joinGame', async params => {
		let uid = await userNamed(socket, params.name);

		let game = await database.addPlayerToGame(params.gameCode, uid, params.name);

		socket.join(params.gameCode);
		ids.get(socket.id).gameCode = params.gameCode;

		socket.emit("gameJoined", {game: game, me: {uid: uid, name: params.name}});
		io.to(params.gameCode).emit("gameUpdated", game);
		io.to(params.gameCode).emit("messagesUpdated", game.messages);
	});

	socket.on('sendMessage', async message => {
		let {id, name, gameCode} = ids.get(socket.id);
		let messages = await database.addMessage(gameCode, message, name, false);
		io.to(gameCode).emit("messagesUpdated", messages);
	});

	socket.on('quitGame', async () => {
		let {id, name, gameCode} = ids.get(socket.id);
		let game = await database.removePlayerFromGame(gameCode, id);
		socket.leave(gameCode);
		if (game){
			io.to(gameCode).emit("gameUpdated", game);
			io.to(gameCode).emit("messagesUpdated", game.messages);
		} else {
			io.to(gameCode).emit("forceQuit");
		}
	});
});

async function userNamed(socket, name, returnRoom = false){
	let { id, currentRoom, returning } = await database.getOrCreateUser(name);
	ids.set(socket.id, {id: id, name: name, gameCode: currentRoom});
	if (currentRoom)
		socket.join(currentRoom);

	if (returning)
		socket.emit("welcomeBack");
	else
		socket.emit("welcome");

	if (returnRoom)
		return {id: id, currentRoom: currentRoom};
	return id;
}

function generateGameCode(gameCodes){
	let randCode;
	do
		randCode = ("000000" + Math.floor(Math.random() * 1000000)).slice(-6);
	while (gameCodes.includes(randCode))
	return randCode;
}
