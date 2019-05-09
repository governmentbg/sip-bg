import { IPaylodAction } from "../interfaces/dispatchers/IAction";
import { IEITAppStore, IOrganizationEdits } from '../interfaces/reducers/IEITAppStore';
import OrganizationEditsAction from '../enums/ActionTypes/OrganizationEditsAction';

let initState = {
	
} as IOrganizationEdits;
const organizationEdits = (state: IOrganizationEdits = initState, action: IPaylodAction) => {
	switch (action.type) {
		case OrganizationEditsAction.SET_EDITING_ORGANIZATION:
			return { organization: action.payload }
		default:
			return state;
	}
}
export default organizationEdits;