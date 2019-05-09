import EITServices from '../../enums/ActionTypes/Services';
import { IPaylodAction, IActionDispatcher } from '../../interfaces/dispatchers/IAction';


export const setServiceData = (serviceData: Object) => {
    return (dispatch: (data: IPaylodAction | IActionDispatcher) => void) => {
        dispatch({
            type: EITServices.UPDATE_DATA_51,
            payload: serviceData
        });
}}
