import { IPaylodAction } from "../interfaces/dispatchers/IAction";
import { IEITAppStore, IUserInfo } from '../interfaces/reducers/IEITAppStore';
import UserInfoAction from '../enums/ActionTypes/UserInfoAction';

let initState = {
	username: "",
    roles: [],
    privilege: "",
    token: "",
    expires: new Date(),
    singInError: undefined,
    loading: false,
    isAdmin: false,
    isMunicipality: false,
    isOperator: false,
    isRegulator: false,
    user: {
        objectid: "",
        autorizedpersonname: "",
        email: "",
        organizationid: "",
        organizationtype: 0,
        authorizedpersonname: "",
        identificationcode: "",
        contactdata: "",
        organizationname: "",
        id: "",
        jointusageregistersubscribtion: false,
        newssubscribtion: false,
        notificationperiod: 1
    }
} as IUserInfo;

const userInfo = (state: IUserInfo = initState, action: IPaylodAction) => {
	switch (action.type) {
		case UserInfoAction.SET_LOADING:
			return { ...state, loading: action.payload }
		case UserInfoAction.SIGN_IN:
			return { ...action.payload, loading: false }
		case UserInfoAction.SIGN_OUT:
			return { ...initState }
		case UserInfoAction.CLEAR_ERROR:
			return { ...state, signInError: undefined, loading: false }
		case UserInfoAction.ERROR_SIGNIN:
			return { ...state, signInError: action.payload, loading: false }
		default:
			return state;
	}
}
export default userInfo;