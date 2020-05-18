import React from 'react';
import { Box, Grid } from '@material-ui/core';

class Die extends React.Component {
	updateDots(){
		let number = this.props.number;

		this.dots = []
		for (let i=0; i<3; i++){
			this.dots.push([]);
			for (let j=0; j<3; j++)
				this.dots[i].push(false);
		}

		if (number % 2 === 1)
			this.dots[1][1] = true;
		if (number > 1){
			this.dots[2][0] = true;
			this.dots[0][2] = true;
		}
		if (number > 3){
			this.dots[0][0] = true;
			this.dots[2][2] = true;
		}
		if (number === 6){
			this.dots[1][0] = true;
			this.dots[1][2] = true;
		}
	}

	render(){
		this.updateDots();
		return (
			<Box style={{width: '12vh', height: '12vh'}} border={2} borderRadius={10} m={10} display='flex' justifyContent='center' alignItems='center' bgcolor={this.props.color}>
				<Grid container style={{width: '75%', height: '75%'}} direction='column' justify='space-around'>
					{[...Array(3).keys()].map(r => (
						<Grid container key={"drow." + r} direction='row' style={{width: '100%'}} justify='space-around'>
							{[...Array(3).keys()].map(c => (
								<Grid item key={"drow." + r + ".col." + c}>
									<Box style={{width: '2vh', height: '2vh'}} borderRadius='50%' bgcolor={this.dots[r][c] ? 'black' : 'transparent'}/>
								</Grid>
							))}
						</Grid>
					))}
				</Grid>
			</Box>
		);
	}
}

export default Die;
