const { GoogleSpreadsheet } = require('google-spreadsheet');

class Cards {
	constructor(){
		this.keys = ['SYS', 'FIN', 'CC', 'CULT'];
		this.initialize();
	}

	async initialize(){
		const doc = new GoogleSpreadsheet('1IS-cYCijNpa81kqpJ5hdXIYDITWva7qCEWwR6o4y9YY');
		doc.useApiKey('AIzaSyAbhq4xKufYgDqB2E3xjuBPSvswKeiYKYE');
		await doc.loadInfo();
		const sheet = doc.sheetsByIndex[0];
		const rows = await sheet.getRows();

		this.cards = {};
		for (let row of rows)
			if (row.Text){
				let card = {type: this.keys.indexOf(row.Category), text: row.Text, offset: (row.Move == 'pos' ? 1 : -1), present: true}
				if (row.Category in this.cards)
					this.cards[row.Category].push(card);
				else
					this.cards[row.Category] = [card];
			}

		this.indices = {};
		for (let key of this.keys){
			this.indices[key] = 0;
			this.cards[key] = this.shuffle(this.cards[key]);
		}
	}

	shuffle(deck){
		let shuffled = deck;
		for (let c=0; c<100; c++){
			let i1 = Math.floor(Math.random() * shuffled.length);
			let i2 = Math.floor(Math.random() * shuffled.length);
			let c1 = shuffled[i1];
			shuffled[i1] = shuffled[i2];
			shuffled[i2] = c1;
		}
		return shuffled;
	}

	getCard(cardKey){
		if (cardKey < 0)
			return {present: false, offset: 0};
		if (cardKey >= this.keys.length)
			return {present: true, offset: 1000};

		let strKey = this.keys[cardKey];
		let index = this.indices[strKey];
		if (index === this.cards[strKey].length-1){
			this.indices[strKey] = 0;
			this.cards[strKey] = this.shuffle(this.cards[strKey]);
		} else {
			this.indices[strKey]++;
		}

		return this.cards[strKey][index];
	}
}

module.exports = Cards;
