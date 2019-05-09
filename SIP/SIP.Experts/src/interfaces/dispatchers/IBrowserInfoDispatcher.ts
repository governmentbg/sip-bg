import { IPaylodAction, IActionDispatcher } from "../../core/interfaces/dispatchers";

export interface IBrowserInfo {
    ip_address: string,
    browser_info: string,
}

export interface IBrowserInfoDispatcher {
    setBrowserInfo(browserInfo: IBrowserInfo): (dispatch: (data: IPaylodAction | IActionDispatcher) => void) => void
}