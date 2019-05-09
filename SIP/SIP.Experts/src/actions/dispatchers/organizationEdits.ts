import { IPaylodAction, IActionDispatcher } from "../../interfaces/dispatchers/IAction";
import OrganizationEditsAction from "../../enums/ActionTypes/OrganizationEditsAction";
import { IGraphic } from "../../core/interfaces/models";

export const setEditingOrganization = (organization: IGraphic) => (dispatch: (data: IPaylodAction | IActionDispatcher) => void) => {
    dispatch({
        type: OrganizationEditsAction.SET_EDITING_ORGANIZATION,
        payload: organization
    })
}
