import { IPaylodAction } from "../../core/interfaces/dispatchers";
import { IActionDispatcher } from './IAction';
import { IAdminServicePayload} from "../../actions/dispatchers/serviceActionDispatcher";

export interface IServiceActionDispatcher {
    showServicePreview(adminServicePayload: IAdminServicePayload): (dispatch: (data: IPaylodAction | IActionDispatcher) => void) => void
}