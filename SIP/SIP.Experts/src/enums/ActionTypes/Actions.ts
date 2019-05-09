import { BaseActions } from "../../core/enums/ActionTypes/Actions";
import UserInfoAction from "./UserInfoAction";
import OrganizationEditsAction from "./OrganizationEditsAction";
import Map from "./Map";
import AdminServiceAction from "./AdminServiceAction";
import EITServices from './Services';
import NotifyAction from './NotifyAction';
import BrowserInfoAction from './BrowserInfo';

interface IEITActions {
    type: OrganizationEditsAction | UserInfoAction | Map | AdminServiceAction | typeof BaseActions | EITServices | NotifyAction | BrowserInfoAction;
}

export default IEITActions;