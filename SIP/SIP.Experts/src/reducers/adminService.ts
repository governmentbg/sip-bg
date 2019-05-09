
import { IPaylodAction } from "../interfaces/dispatchers/IAction";
import { IAdminService } from "../interfaces/reducers/IEITAppStore";
import AdminServiceAction from '../enums/ActionTypes/AdminServiceAction';
import { number } from 'prop-types';

let initState = {
    adminServiceData: { serviceOID: 0, serviceCode: 0 },
} as IAdminService;

const adminService = (state: IAdminService = initState, action: IPaylodAction) => {
    switch (action.type) {
        case AdminServiceAction.SHOW_PREVIEW:
            return { ...state, adminServiceData: action.payload };
        default:
            return state;
    }
}

export default adminService;
