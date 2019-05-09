import axios from "axios";
import { IPaylodAction, IActionDispatcher } from '../../interfaces/dispatchers/IAction';
import { IBrowserInfo } from '../../interfaces/dispatchers/IBrowserInfoDispatcher';

export const getIPAddress = (): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        axios.get('https://api.ipify.org').then((response: any) => {
            resolve(response.data);
        }).catch(err => {
            resolve('');
        });
    });
}
export const getBrowserInfo = (): string => {
    return `${navigator.vendor} ${navigator.userAgent}`;
}

export const setBrowserInfo = (browserInfo: IBrowserInfo) => {
    return (dispatch: (data: IPaylodAction | IActionDispatcher) => void) => {
        dispatch({
            type: "[application] Browser Info Initialized",
            payload: browserInfo,
        });
}}
