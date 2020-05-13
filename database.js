const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb+srv://server:o3SljBQinvzZBK0Y@shanghai-zbfao.mongodb.net/test?retryWrites=true&w=majority';

class Database {
	constructor(){
		this.verifyDb();
	}

	async verifyDb(){
		while (!this.client || !this.db){
			this.client = await MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}).catch(console.log);
			this.db = this.client.db("isp");
		}
	}

	async addPlayerToRoom(room, id){
		await this.db.collection('users').updateOne({_id: id}, {$set: {currentRoom: room}}).catch(console.log);
	}

	async getOrCreateUser(name){
		await this.verifyDb();
		let user = await this.db.collection('users').findOne({name: name}).catch(console.log);
		if (user)
			return {id: user._id, currentRoom: user.currentRoom, returning: true};

		let res = await this.db.collection('users').insertOne({name: name, currentRoom: ''}).catch(console.log);
		return {id: res.ops[0]._id, currentRoom: res.ops[0].currentRoom, returning: false};
	}

	async createGame(gameCode, leaderId, leaderName){
		await this.verifyDb();

		await this.addPlayerToRoom(gameCode, leaderId);

		await this.db.collection('gameCodes').insertOne({gameCode: gameCode}).catch(console.log);
		let res = await this.db.collection('games').insertOne({
			gameCode: gameCode,
			leaderId: leaderId,
			players: [{
				id: leaderId,
				name: leaderName,
				cards: [],
				down: [],
				buys: 0
			}],
			messages: [
				{message: `${leaderName} created the game`, serverMessage: true, senderName: "Server"}
			]
		}).catch(console.log);
		return res.ops[0];
	}

	async getGameCodes(){
		await this.verifyDb();

		let res = await this.db.collection('gameCodes').find({}).toArray();
		let gameCodes = [];
		for (let gameCode of res)
			gameCodes.push(gameCode.gameCode);
		return gameCodes;
	}

	async addPlayerToGame(gameCode, id, name){
		let res = await this.db.collection('games').findOne({gameCode: gameCode, 'players.id': id});
		if (res){
			console.log("caught a dup");
			return res;
		}

		await this.addPlayerToRoom(gameCode, id);

		res = await this.db.collection('games').findOneAndUpdate({gameCode: gameCode}, {
			$push: {
				players: {
					id: id,
					name: name,
					cards: [],
					down: [],
					buys: 0
				},
				messages: {message: `${name} joined the game`, serverMessage: true, senderName: "Server"}
			}
		}, {returnOriginal: false}).catch(console.log);

		return res.value;
	}

	async getGame(gameCode){
		let game = await this.db.collection('games').findOne({gameCode: gameCode}).catch(console.log);
		return game;
	}

	async addMessage(gameCode, message, name, serverMessage){
		let res = await this.db.collection('games').findOneAndUpdate({gameCode: gameCode}, {
			$push: {
				messages: {message: message, serverMessage: serverMessage, senderName: name}
			}
		}, {returnOriginal: false}).catch(console.log);

		return res.value.messages;
	}
}

module.exports = Database;
