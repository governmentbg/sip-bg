import { IPaylodAction } from "../interfaces/dispatchers/IAction";
import { IBrowserInfo } from "../interfaces/dispatchers/IBrowserInfoDispatcher";
import BrowserInfoAction from '../enums/ActionTypes/BrowserInfo';

let initState = {
    ip_address: '',
    browser_info: '',
} as IBrowserInfo;

const browserInfo = (state: IBrowserInfo = initState, action: IPaylodAction) => {
	switch (action.type) {
        case BrowserInfoAction.Initialize:
            return { ...state, ...action.payload }
		default:
			return state;
	}
}
export default browserInfo;