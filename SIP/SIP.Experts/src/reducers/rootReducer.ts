import { baseNodesCopy } from "../core/reducers/rootReducer";
import { combineReducers } from 'redux';

import eit from "./eit";

const rootReducer = combineReducers({...baseNodesCopy, eit})

export default rootReducer;