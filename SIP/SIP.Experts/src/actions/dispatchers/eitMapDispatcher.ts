import MapActivation from '../../enums/ActionTypes/Map';
import { IPaylodAction, IActionDispatcher } from '../../interfaces/dispatchers/IAction';
import { mosaicLayoutDispatcher } from '../../core/actions/common/dispatchers';
import EITAppWindow from '../../enums/EITAppWindow';

export const activateMap = (isActiveMap: boolean) => {
    return (dispatch: (data: IPaylodAction | IActionDispatcher) => void) => {
        dispatch({
            type: MapActivation.ACTIVATE_MAP,
            payload: isActiveMap
        });
        dispatch(mosaicLayoutDispatcher.showWindow(EITAppWindow.map));
}}
