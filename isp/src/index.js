import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Switch, Route, useLocation } from "react-router-dom"
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { indigo } from '@material-ui/core/colors';
import { CssBaseline } from '@material-ui/core';
import Start from './Start';
import GameWaiting from './GameWaiting';
import Client from './Client';
import openSocket from 'socket.io-client';


const socket = openSocket('http://localhost:5000');

const theme = createMuiTheme({
	palette: {
		primary: {
			main: '#fa8072'
		},
		secondary: indigo
	}
});

ReactDOM.render(
	<React.StrictMode>
		<ThemeProvider theme={theme}><CssBaseline>
		<Router>
			<Switch>
				<Route path="/" exact component={StartWrapper}/>
				<Route path="/game/:gameCode" component={ClientWrapper}/>
				<Route path="/:gameCode" component={GameWaitingWrapper}/>
			</Switch>
		</Router>
		</CssBaseline></ThemeProvider>
	</React.StrictMode>,
	document.getElementById('root')
);

function StartWrapper(){
	let location = useLocation();
	var name;
	if (location && location.state && location.state.name)
		name = location.state.name;
	return <Start socket={socket} name={name}/>;
}

function GameWaitingWrapper(){
	let location = useLocation();
	console.log(location.state);
	return <GameWaiting socket={socket} game={location.state.game} me={location.state.me}/>;
}

function ClientWrapper(){
	let location = useLocation();
	return <Client socket={socket} game={location.state.game} me={location.state.me}/>;
}
