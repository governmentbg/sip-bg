import { IPaylodAction, IActionDispatcher } from '../../interfaces/dispatchers/IAction';
import AdminServiceAction from "../../enums/ActionTypes/AdminServiceAction";

export interface IAdminServicePayload {
    serviceCode: number,
    serviceOID: number,
    incomingnumber?: string,
    attributes?: any,
    serviceparameters?: any,
}

export const showServicePreview = (adminServicePayload: IAdminServicePayload) => {
    return (dispatch: (data: IPaylodAction | IActionDispatcher) => void) => {
        dispatch({
            type: AdminServiceAction.SHOW_PREVIEW,
            payload: adminServicePayload,
        });
    }
}
