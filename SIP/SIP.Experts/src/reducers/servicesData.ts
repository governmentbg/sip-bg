import { IPaylodAction } from "../interfaces/dispatchers/IAction";
import EITServices from '../enums/ActionTypes/Services';
import { IEITServices } from "../interfaces/reducers/IEITAppStore";

let initState = {
    51: {
        applicantType: "Person",
        date: "",
        authorizedpersonname: "sender_value",
        identificationcode: "eik_value",
        organizationname: "name_of_organization",
        contactdata: "contactdata_value",
        email: "email_value",
        recipient: "to_value",
        subject: "subject_value",
        message: "message_value",
        uniqueIdOfRecipient: "unique_id_of_recipient"
    }
} as IEITServices;

const servicesData = (state: IEITServices = initState, action: IPaylodAction) => {
	switch (action.type) {
		case EITServices.UPDATE_DATA_51:
			return { ...state, 51: {...state[51], ...action.payload} }
		default:
			return state;
	}
}
export default servicesData;