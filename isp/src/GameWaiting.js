import React from 'react';
import { Redirect } from 'react-router';
import { Button, TextField, Divider, Card, CardContent, Box, Grid, List, ListItemText, IconButton } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack'
import Chat from './Chat.js';

class GameWaiting extends React.Component {
	constructor(props){
		super(props);

		this.socket = props.socket;
		this.game = props.game;
		this.me = props.me;

		this.state = {players: this.game.players, goBack: false, goForward: false};
	}

	componentDidMount(){
		this.socket.emit("userSync", this.me.name);

		this.socket.on("gameUpdated", game => {
			this.game = game;
			this.setState((state, props) => ({
				players: this.game.players
			}));
		});

		this.socket.on("forceQuit", () => {
			this.socket.emit("quitGame");
			this.setState((state, props) => ({
				goBack: true
			}));
		});
	}

	handleQuit = () => {
		this.socket.emit("quitGame");
		this.setState((state, props) => ({
			goBack: true
		}));
	}

	handleStartGame = () => {
		this.socket.emit("startGame");
		this.setState((state, props) => ({
			goForward: true
		}));
	}

	render(){
		if (this.state.goBack)
			return <Redirect to={{pathname: '/', state: {name: this.me.name}}}/>;
		else if (this.state.goForward)
			return <Redirect to={{pathname: '/game/' + this.game.gameCode, state: {game: this.game, me: this.me}}}/>;

		return (
			<Grid container style={{minHeight: '100vh'}} direction='row' justify='center' alignItems='center'>
			<Grid item style={{width: '80%'}} align='center'>
				<Card style={{width: "25vw"}}><CardContent>
					<Grid container direction='column' justify='space-between' alignItems='stretch' style={{height: '45vh'}}>
						<Grid container item>
							<Grid item xs>
								<IconButton onClick={this.handleQuit}>
									<ArrowBackIcon/>
								</IconButton>
							</Grid>
							<Grid item xs={9}>
								<h1 style={{color: 'salmon'}}>{this.game.gameCode.slice(0, 3) + "-" + this.game.gameCode.slice(3)}</h1>
							</Grid>
							<Grid item xs/>
						</Grid>

						<Grid item>
							<List component="nav">
								{this.state.players.map((item, index) => <ListItemText key={item.id} primary={item.name + (item.id === this.me.uid ? " (You)" : "")}/>)}
							</List>
						</Grid>

						<Grid item>
							<Button color='primary' variant='contained' disabled={this.game.leaderId !== this.me.uid} onClick={this.handleStartGame}>Start Game</Button>
						</Grid>
					</Grid>
				</CardContent></Card>
			</Grid>
			<Grid item style={{width: '20%'}}>
				<Chat socket={this.socket} messages={this.game.messages} me={this.me}/>
			</Grid>
			</Grid>
		);
	}
}

export default GameWaiting;
