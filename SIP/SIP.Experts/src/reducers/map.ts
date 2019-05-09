
import { IPaylodAction } from "../interfaces/dispatchers/IAction";
import MapActivation from '../enums/ActionTypes/Map';

let initState = {
    isMapActive: true
} as any;

const eitMap = (state = initState, action: IPaylodAction) => {
    switch (action.type) {
        case MapActivation.ACTIVATE_MAP:
            return { isMapActive: action.payload };
        // case MapActivation.DEACTIVATE_MAP:
        //     return { isMapActive: action.payload};
        default:
            return state;
    }
}

export default eitMap;
