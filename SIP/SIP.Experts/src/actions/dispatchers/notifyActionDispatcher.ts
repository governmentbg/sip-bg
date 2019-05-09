import { IPaylodAction, IActionDispatcher } from '../../interfaces/dispatchers/IAction';
import NotifyAction from "../../enums/ActionTypes/NotifyAction";

export const setNew53 = (notifyInfoPayload: number) => {
    return (dispatch: (data: IPaylodAction | IActionDispatcher) => void) => {
        dispatch({
            type: NotifyAction.SET_NEW_53,
            payload: notifyInfoPayload,
        });
    }
}
export const setNewRegistrationRequests = (notifyInfoPayload: number) => {
    return (dispatch: (data: IPaylodAction | IActionDispatcher) => void) => {
        dispatch({
            type: NotifyAction.SET_NEW_REGISTRATIION,
            payload: notifyInfoPayload,
        });
    }
}