import React from 'react';
import { Redirect } from 'react-router';
import { Button, TextField, Divider, Card, CardContent, Box, Grid, List, ListItemText, IconButton } from '@material-ui/core';
import Chat from './Chat.js';
import CCIcon from '@material-ui/icons/Eco';
import CultIcon from '@material-ui/icons/SupervisorAccount';
import SysIcon from '@material-ui/icons/Settings';
import FinIcon from '@material-ui/icons/AccountBalance';
import Square from './Square.js';
import Consts from './Consts.js';

class Client extends React.Component {
	constructor(props){
		super(props);

		this.socket = props.socket;
		this.game = props.game;
		this.me = props.me;

		Square.generateLocations();

		this.state = {playersSquares: [0, 0, 0, 0]};
	}

	componentDidMount(){
	}

	render(){
		return (
			<Grid container style={{minHeight: '100vh', minWidth: '100vw'}} direction='row' justify='center' alignItems='center'>
				<Grid container style={{width: '80%', minHeight: '100vh'}} alignItems='center' justify='center'>
					<Grid container style={{width: 'calc(40vw - 44vh)'}} direction='column' alignItems='center'>
						{this.renderCards()}
					</Grid>

					<Grid item>
						{this.renderBoard()}
					</Grid>

					{this.renderRight()}
				</Grid>

				<Grid item style={{width: '20%'}}>
					<Chat socket={this.socket} messages={this.game.messages} me={this.me}/>
				</Grid>
			</Grid>
		);
	}

	renderCards(){
		return [...Array(4).keys()].map(card => (
			<Grid item>
				<Box bgcolor={Consts.COLORS[Consts.ORDER[card]]} style={{height: '18vh', width: '12vh'}} m='2vh' border={2} borderRadius={10}
					alignItems='center' justifyContent='center' display='flex'>

					{card === 0 ? <SysIcon style={{width: '6vh', height: '6vh'}}/> :
						card === 1 ? <FinIcon style={{width: '6vh', height: '6vh'}}/> :
						card === 2 ? <CCIcon style={{width: '6vh', height: '6vh'}}/> :
						card === 3 ? <CultIcon style={{width: '6vh', height: '6vh'}}/> : null}
				</Box>
			</Grid>
		));
	}

	renderRight(){
		return (
			<Grid container style={{width: 'calc(40vw - 44vh)'}} alignContent='center' alignItems='center' justify='center'>
				<Grid item>
				</Grid>

				<Grid item>
					<Box style={{height: '18vh', width: '12vh'}} m='2vh' border={2} borderRadius={10}/>
				</Grid>
			</Grid>
		);
	}

	renderBoard(){
		return [...Array(10).keys()].map(y => (
			<Grid container direction='row' key={"y." + y} justify='center' alignItems='center' style={{height: Consts.BOX_S}}>
				{[...Array(11).keys()].map(x => (
					<Square key={"sq." + y + "." + x} loc={{x: x, y: y}} playersSquares={this.state.playersSquares}/>
				))}
			</Grid>
		));
	}
}

export default Client;
