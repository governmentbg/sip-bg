
import { IPaylodAction } from "../interfaces/dispatchers/IAction";
import { INotifyInfo } from "../interfaces/reducers/IEITAppStore";
import NotifyAction from '../enums/ActionTypes/NotifyAction';

let initState = {
    newRegistrationRequestsCount: 0,
    new53Count: 0
} as INotifyInfo;

const notifyInfo = (state: INotifyInfo = initState, action: IPaylodAction) => {
    switch (action.type) {
        case NotifyAction.SET_NEW_REGISTRATIION:
            return { ...state, newRegistrationRequestsCount: action.payload };
        case NotifyAction.SET_NEW_53:
            return { ...state, new53Count: action.payload };
        default:
            return state;
    }
}

export default notifyInfo;
