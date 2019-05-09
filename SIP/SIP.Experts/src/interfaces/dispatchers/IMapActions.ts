import { IPaylodAction } from "../../core/interfaces/dispatchers";
import { IActionDispatcher } from './IAction';

export interface IMapAction {
    activateMap(isActiveMap: boolean): (dispatch: (data: IPaylodAction | IActionDispatcher) => void) => void
}