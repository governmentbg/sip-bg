import { combineReducers } from 'redux';
import userInfo from "./userInfo";
import organizationEdits from "./organizationEdits";
import eitMap from "./map";
import adminService from "./adminService";
import servicesData from "./servicesData";
import notifyInfo from "./notifyInfo";
import browserInfo from "./browserInfo";

const eit = combineReducers({
    userInfo,
    organizationEdits,
    eitMap,
    adminService,
    servicesData,
    notifyInfo,
    browserInfo,
})

export default eit;