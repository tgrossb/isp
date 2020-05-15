import { red, yellow, lightGreen, blue, purple } from '@material-ui/core/colors';
import BarnIcon from './barn.svg';
import CarrotIcon from './carrot.svg';
import MilkIcon from './milk.svg';
import RakeIcon from './rake.svg';

class Consts {
	static get BOX_S(){return '8vh'}
	static get BOARD_H(){return '80vh'}
	static get BOARD_W(){return '88vh'}

	static get CULT(){return 'cult'}
	static get FIN(){return 'fin'}
	static get CC(){return 'cc'}
	static get SYS(){return 'sys'}

	static get START(){return {x: 0, y: 9}}
	static get END(){return {x: 4, y: 4}}

	static get START_COLOR(){return purple[200]}
	static get END_COLOR(){return purple[200]}
	static get CLEAR(){return 'transparent'}

	static get BLUE(){return blue[400]}
	static get GREEN(){return lightGreen[700]}
	static get RED(){return red[500]}
	static get YELLOW(){return yellow[500]}

	static get ORDER(){return [Consts.CULT, Consts.FIN, Consts.CC, Consts.SYS]}
	static get COLORS(){return {[Consts.CULT]: Consts.BLUE, [Consts.FIN]: Consts.GREEN, [Consts.CC]: Consts.RED, [Consts.SYS]: Consts.YELLOW}}

	static get UP(){return {x: 0, y: -1}}
	static get DOWN(){return {x: 0, y: 1}}
	static get LEFT(){return {x: -1, y: 0}}
	static get RIGHT(){return {x: 1, y: 0}}

	static get PLAYER_ICONS (){return [BarnIcon, CarrotIcon, MilkIcon, RakeIcon]}

	static locEq(loc1, loc2){
		return (loc1.x === loc2.x && loc1.y === loc2.y);
	}
}

export default Consts;
