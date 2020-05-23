import React from 'react';
import { Redirect } from 'react-router';
import InputMask from "react-input-mask";
import { Button, TextField, Card, CardContent, Box, Grid } from '@material-ui/core';
import Logo from './logo.svg';

class Start extends React.Component {
	constructor(props){
		super(props);

		this.socket = props.socket;

		this.gameCodes = [];
		this.state = {name: (props.name ? props.name : ''), gameCode: '', nameError: false, gameCodeError: false, gameCodeErrorText: '', gameRedirect: null};

		this.socket.emit("userSync");

		this.socket.on("gameCodesUpdated", gameCodes => {
			this.gameCodes = gameCodes;
		});
	}

	componentDidMount(){
		this.socket.on("gameJoined", bundle => {
			this.setState((state, props) => ({
				gameRedirect: bundle
			}));
		});
	}

	handleCreateGame = () => {
		if (this.state.name.trim() === ''){
			this.setState((state, props) => ({
				nameError: true
			}));
			return;
		}

		this.socket.emit("createGame", this.state.name);
	}

	handleJoinGame = () => {
		const nameValid = this.state.name.trim() !== '';
		const codeValid = this.state.gameCode.length === 6;
		const gameExists = codeValid && this.gameCodes.includes(this.state.gameCode);

		if (nameValid && gameExists){
			this.socket.emit("joinGame", {name: this.state.name, gameCode: this.state.gameCode});
			return;
		}

		this.setState((state, props) => ({
			nameError: !nameValid,
			gameCodeError: !gameExists,
			gameCodeErrorText: codeValid ? "This game doesn't exist" : ""
		}));
	}

	handleFieldUpdate(e){
		let { name, value } = e.target;
		if (name === 'gameCode')
			value = value.replace('-', '').trim();
		this.setState((state, props) => ({
			[name]: value,
			[name+"Error"]: false,
			[name+"ErrorText"]: ''
		}));
	}

	render(){
		if (this.state.gameRedirect)
			return (<Redirect push to={{
					pathname: "/" + this.state.gameRedirect.game.gameCode,
					state: {game: this.state.gameRedirect.game, me: this.state.gameRedirect.me}
				}}/>);

		return (
			<Grid container style={{minHeight: '100vh'}} direction='column' justify='center' alignItems='center'><Grid item>
				<Card style={{width: "fit-content"}}><CardContent>
					<Grid container direction='column'>
						<Grid item><Box p={3}>
							<img src={Logo} style={{width: "75%", height: "auto", display: "block", marginLeft: "auto", marginRight: "auto"}} alt=''/>
						</Box></Grid>

						<Grid item><Box display='flex' flexDirection='column' alignItems='center' width="fit-content" p={2}>
							<Box m={3}>
								<TextField defaultValue={this.state.name} name="name"
									error={this.state.nameError} onChange={e => this.handleFieldUpdate(e)}
									label="Name" variant="outlined" autoComplete='off'/>
							</Box>

							<Grid container direction='row' justify='center' alignItems='center'>
								<Grid item xs>
									<Box display='flex' justifyContent="flex-end" mr={4}>
										<Button onClick={this.handleCreateGame} variant='contained' color='primary'>Create Game</Button>
									</Box>
								</Grid>

								<Grid item xs>
									<Box display='flex' flexDirection='column' alignSelf='center' py={3} pl={4} borderLeft={1} borderColor="grey.300">
										<InputMask mask="999-999" maskChar=" " onChange={e => this.handleFieldUpdate(e)}>{
											() => <TextField
												name="gameCode"
												error={this.state.gameCodeError}
												helperText={this.state.gameCodeErrorText}
												label="Game Code" variant="outlined" type="search"
												/>
										}</InputMask>
										<Box my={0.5}/>
										<Button onClick={this.handleJoinGame} variant='contained' color='primary'>Join Game</Button>
									</Box>
								</Grid>
							</Grid>
						</Box></Grid>
					</Grid>
				</CardContent></Card>
			</Grid></Grid>
		);
	}
}

export default Start;
