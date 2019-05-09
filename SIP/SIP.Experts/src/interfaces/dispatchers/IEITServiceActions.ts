import { IPaylodAction } from "../../core/interfaces/dispatchers";
import { IActionDispatcher } from './IAction';
import { Iservice51Data } from "../reducers/IEITAppStore";

export interface IEITServiceActions {
    setServiceData(serviceData: Iservice51Data): (dispatch: (data: IPaylodAction | IActionDispatcher) => void) => void
}