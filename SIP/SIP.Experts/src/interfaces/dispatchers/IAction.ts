import IActions from "../../enums/ActionTypes/Actions";

export interface IPaylodAction<T = any>  extends IActions{
    payload: T
}
export interface IActionDispatcher {

}