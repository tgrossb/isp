import React from 'react';
import { Grid, Box, TextField, Divider, List, ListItem, ListSubheader, ListItemText, InputAdornment, IconButton, Paper } from '@material-ui/core';
import SendIcon from '@material-ui/icons/Send';

class Chat extends React.Component {
	constructor(props){
		super(props);

		this.socket = props.socket;
		this.messages = this.formatMessages(props.messages);
		this.me = props.me;

		this.state = {messages: this.messages};
		this.messageInput = React.createRef();
	}

	componentDidMount(){
		this.socket.emit("userSync", this.me.name);

		this.socket.on("messagesUpdated", messages => {
			this.messages = this.formatMessages(messages);
			this.setState((state, props) => ({
				messages: this.messages
			}));
		});
		this.box.scrollTop = this.box.scrollHeight;
	}

	componentDidUpdate(){
		this.box.scrollTop = this.box.scrollHeight;
	}

	formatMessages(messages){
		let newMessages = [];
		for (let message of messages){
			if (newMessages.length === 0 || (message.senderName !== newMessages[newMessages.length-1].senderName))
				newMessages.push({lines: [message.message], senderName: message.senderName, serverMessage: message.serverMessage})
			else
				newMessages[newMessages.length-1].lines.push(message.message);
		}
		return newMessages;
	}

	handleSend = (e) => {
		e.preventDefault();

		// Takes some manipulation because of material ui
		const value = this.messageInput.current.firstChild.firstChild.value;
		this.messageInput.current.firstChild.firstChild.value = ''

		this.socket.emit("sendMessage", value);
	}

	render(){
		return (
			<Grid container direction='column' justify='space-between' style={{maxHeight: "100vh"}}>
				<Grid item><Box display='flex' flexDirection='column' style={{height: "calc(100vh - 72px)", overflow: 'auto'}} ref={el => (this.box = el)}>
					<Paper style={{height: "100%"}}>
						<List dense style={{backgroundColor: 'inherit'}}>{this.state.messages.map(this.renderItem)}</List>
					</Paper>
				</Box></Grid>
				<Grid item><Paper><Box p={2} pt={0}>
					<form onSubmit={this.handleSend}>
					<TextField style={{width: 'calc(20vw - 32px)'}} placeholder="Send a message..." variant="outlined" ref={this.messageInput} InputProps={{
						endAdornment: <InputAdornment position='end'>
							<IconButton type="submit">
								<SendIcon/>
							</IconButton>
						</InputAdornment>
					}}/></form>
				</Box></Paper></Grid>
			</Grid>
		);
	}

	renderItem = (sItem, sIndex) => {
		const senderName = (sItem.senderName === this.me.name ? "You" : sItem.senderName);
		return (
			<li key={`section-${sIndex}`} style={{backgroundColor: 'inherit'}}>
				<ul style={{padding: "0", backgroundColor: 'inherit'}}>
					<ListSubheader style={{backgroundColor: 'rgb(250, 250, 250)'}}>{senderName}</ListSubheader>
					{sItem.lines.map((item, index) => (
						<ListItem key={`item-${sIndex}-${index}`}>
							<ListItemText primary={item}/>
						</ListItem>
					))}
					{sIndex !== this.messages.length-1 && <Divider/>}
				</ul>
			</li>
		);
	}
}

export default Chat;
