import React from 'react';
import { Box, Grid } from '@material-ui/core';
import Consts from './Consts';

class Square extends React.Component {
	static locations = [];

	constructor(props){
		super(props);

		this.loc = props.loc;
		this.index = Square.locations.findIndex(loc => Consts.locEq(loc, this.loc));
		this.color = this.calcColor(this.index);
	}

	updatePlayersHere(){
		let playersHere = [];
		let any = false;
		for (let c=0; c<this.props.playersSquares.length; c++){
			playersHere.push(this.props.playersSquares[c] === this.index);
			any = (any || playersHere[c]);
		}
		return {playersHere: playersHere, any: any};
	}

	static generateLocations(){
		Square.locations = [];
		let loc = Consts.START;
		while (true){
			Square.locations.push(loc);
			loc = Square.getNextLoc(loc);
			if (Consts.locEq(loc, Consts.END)){
				Square.locations.push(loc);
				break;
			}
		}
	}

	static getNextLoc(loc){
		let nextVec = Square.getNextLocVector(loc);
		return {x: loc.x + nextVec.x, y: loc.y + nextVec.y};
	}

	static getNextLocVector(loc){
		let {x, y} = loc;

		if ((x === 0 && y === 0) || (x === 2 && y === 2))
			return Consts.RIGHT;
		if ((x === 10 && y === 0) || (x === 8 && y === 2))
			return Consts.DOWN;
		if ((x === 10 && y === 9) || (x === 8 && y === 7))
			return Consts.LEFT;
		if ((x === 2 && y === 9) || (x === 4 && y === 7))
			return Consts.UP;

		if (x === 0) return Consts.UP;
		if (y === 0) return Consts.RIGHT;
		if (x === 10) return Consts.DOWN;
		if (y === 9) return Consts.LEFT;
		if (x === 2) return Consts.UP;
		if (y === 2) return Consts.RIGHT;
		if (x === 8) return Consts.DOWN;
		if (y === 7) return Consts.LEFT;
		if (x === 4) return Consts.UP;
	}

	calcColor(index){
		if (index === -1)
			return Consts.CLEAR
		if (Consts.locEq(this.loc, Consts.START))
			return Consts.START_COLOR;
		if (Consts.locEq(this.loc, Consts.END))
			return Consts.END_COLOR;

		index--;
		if (index < 20)
			return Consts.COLORS[Consts.ORDER[Math.floor(index/5)]];
		index -= 20;
		if (index < 16)
			return Consts.COLORS[Consts.ORDER[Math.floor(index/4)]];
		index -= 16;
		if (index < 12)
			return Consts.COLORS[Consts.ORDER[Math.floor(index/3)]];
		index -= 12;
		if (index < 8)
			return Consts.COLORS[Consts.ORDER[Math.floor(index/2)]];
		return Consts.COLORS[Consts.ORDER[index-8]];
	}

	render(){
		let {playersHere, any} = this.updatePlayersHere();
		let key = "y." + this.loc.y + ".x." + this.loc.x;
		return (
			<Grid item key={key} style={{width: Consts.BOX_S, height: '100%'}}>
				<Box border={(this.color === Consts.CLEAR) ? 0 : 1} style={{width: '100%', height: '100%'}} bgcolor={this.color}>
					{any ? (<Grid container key={key + ".icons"}style={{width: '100%', height: '100%'}}>
						{[...Array(2).keys()].map(r => (
							<Grid container key={key + ".ir." + r}direction='row' style={{width: '100%', height: '50%'}}>
								{[...Array(2).keys()].map(c => (
									<Grid item key={key + ".ir" + r + ".ic." + c} style={{width: '50%', height: '100%'}}>
										<Box p={0.5}>
											{playersHere[2*r+c] ? <img src={Consts.PLAYER_ICONS[2*r+c]}/> : null}
										</Box>
									</Grid>
								))}
							</Grid>
						))}
					</Grid>) : null}
				</Box>
			</Grid>
		);
	}
}

export default Square;
