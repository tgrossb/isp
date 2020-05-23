import React from 'react';
import { Redirect } from 'react-router';
import { Box, Grid } from '@material-ui/core';
import CCIcon from '@material-ui/icons/Eco';
import CultIcon from '@material-ui/icons/SupervisorAccount';
import SysIcon from '@material-ui/icons/Settings';
import FinIcon from '@material-ui/icons/AccountBalance';
import Chat from './Chat.js';
import Square from './Square.js';
import Die from './Die.js';
import Consts from './Consts.js';
import useFitText from 'use-fit-text';

class Client extends React.Component {
	constructor(props){
		super(props);

		this.socket = props.socket;
		this.game = props.game;
		this.me = props.me;

		Square.generateLocations();

		this.state = {playersSquares: [0, 0, 0, 0], dieNumber: 6, card: {present: false}, yourTurn: false, winner: null, goHome: false};
	}

	componentDidMount(){
		this.socket.on('rollCompleted', async n => {
			await this.rollDie(n);
			this.socket.emit('requestPlayersSquares');
			this.socket.emit('requestCard');
		});

		this.socket.on('cardServed', card => {
			this.setState((state, props) => ({
				card: card
			}));
		});

		this.socket.on('playersSquaresUpdated', async playersSquares => {
			this.setState({playersSquares: playersSquares});
		});

		this.socket.on('turnChanged', currentId => {
			this.setState((state, props) => ({
				yourTurn: (currentId === this.me.uid)
			}));
		});

		this.socket.on('winner', name => {
			this.setState({winner: name});
		});

		this.socket.emit('userSync', this.me.name);
	}

	async rollDie(n) {
		let lastNumber = 0;
		for (let c=0; c<5; c++){
			let number = lastNumber;
			while (number === lastNumber)
				number = Math.floor(Math.random() * 6) + 1;
			this.setState((state, props) => ({
				dieNumber: number
			}));
			await new Promise(resolve => setTimeout(resolve, 100));
		}

		this.setState((state, props) => ({
			dieNumber: n,
		}));
	}

	render(){
		if (this.state.goHome)
			return <Redirect to={{pathname: '/', state: {name: this.me.name}}}/>;
		return (
			<Box>
				<Grid container key='m' style={{minHeight: '100vh', minWidth: '100vw', position: 'absolute'}} direction='row' justify='center' alignItems='center'>
					<Grid container key='ms' style={{width: '80%', minHeight: '100vh'}} alignItems='center' justify='center'>
						<Grid container key='msc' style={{width: 'calc(40vw - 44vh)'}} direction='column' alignItems='center'>
							{this.renderCards()}
						</Grid>

						<Grid item key='msb'>
							{this.renderBoard()}
						</Grid>

						{this.renderRight()}
					</Grid>

					<Grid item key='mchat' style={{width: '20%'}}>
						<Chat socket={this.socket} messages={this.game.messages} me={this.me}/>
					</Grid>
				</Grid>

				{this.state.winner && (
					<div onClick={() => this.setState({goHome: true})}>
					<Box style={{position: 'absolute', width: '80vw', height: '10vh', top: '41vh'}} bgcolor='rgba(0, 0, 0, 0.5)' display='flex' justifyContent='center' alignItems='center'>
						<h1 style={{color: 'white'}}>{this.state.winner + " won"}</h1>
					</Box></div>)}
			</Box>
		);
	}

	renderCards(){
		return [...Array(4).keys()].map(card => (
			<Grid item key={'msc.' + card}>
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
			<Grid container key='msr' style={{width: 'calc(40vw - 44vh)'}} alignContent='center' alignItems='center' direction='column'>
				<Grid item key='msrd'>
					<div onClick={() => this.socket.emit('rollDie')}>
						<Die number={this.state.dieNumber} color={this.state.yourTurn ? 'transparent' : 'rgba(0, 0, 0, 0.05)'}/>
					</div>
				</Grid>

				<Grid item key='msrc'>
					{this.state.card.present ? this.renderCard() : this.renderCardSpace()}
				</Grid>
			</Grid>
		);
	}

	renderCardSpace(){
		return (<Box style={{height: '36vh', width: '24vh'}} m={10} border={2} borderRadius={10} bgcolor='rgba(0, 0, 0, 0.1)'/>);
	}

	renderCard(){
		let {type, text, offset, ownerId, back} = this.state.card;
		let yours = (ownerId === this.me.uid);

		if (back)
			return (
				<div onClick={() => this.socket.emit('flipCard', this.state.card)}>
					<Box bgcolor={Consts.COLORS[Consts.ORDER[type]]} m={10} style={{height: '36vh', width: '24vh'}} border={2} borderRadius={10}
						alignItems='center' justifyContent='center' display='flex'>
							{type === 0 ? <SysIcon style={{width: '12vh', height: '12vh'}}/> :
								type === 1 ? <FinIcon style={{width: '12vh', height: '12vh'}}/> :
								type === 2 ? <CCIcon style={{width: '12vh', height: '12vh'}}/> :
								type === 3 ? <CultIcon style={{width: '12vh', height: '12vh'}}/> : null}
					</Box>
				</div>
			);

		return (
			<div onClick={() => this.socket.emit('surrenderTurn')}>
				<Box style={{height: '36vh', width: '24vh'}} m={10} border={2} borderRadius={10} bgcolor={yours ? 'transparent' : 'rgba(0, 0, 0, 0.05)'}>
					<Grid container direction='column' style={{width: '100%', height: '100%'}} alignItems='center' wrap='nowrap'>
						<Grid item><Box style={{width: '6vh', height: '6vh'}}>
							{type === 0 ? <SysIcon style={{width: '6vh', height: '6vh', color: Consts.COLORS[Consts.SYS]}}/> :
								type === 1 ? <FinIcon style={{width: '6vh', height: '6vh', color: Consts.COLORS[Consts.FIN]}}/> :
								type === 2 ? <CCIcon style={{width: '6vh', height: '6vh', color: Consts.COLORS[Consts.CC]}}/> :
								type === 3 ? <CultIcon style={{width: '6vh', height: '6vh', color: Consts.COLORS[Consts.CULT]}}/> : null}
						</Box></Grid>

						<Grid item>
							<Box style={{width: '100%', height: '24vh'}} display='flex' alignItems='center'>
								<CardText text={text}/>
							</Box>
						</Grid>

						<Grid item>
							<Box textAlign='center' display='flex' alignItems='center' fontSize='2vh' style={{height: '6vh'}}>{offset}</Box>
						</Grid>
					</Grid>
				</Box>
			</div>
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

const CardText = ({text}) => {
	const { fontSize, ref } = useFitText();

	return (
		<div ref={ref} style={{ fontSize, width: '22vh', maxHeight: '24vh', textAlign: 'center', verticalAlign: 'middle' }}>{text}</div>
	);
}

export default Client;
