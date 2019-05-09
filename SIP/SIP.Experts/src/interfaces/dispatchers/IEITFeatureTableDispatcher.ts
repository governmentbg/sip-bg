import { IFeatureTableDispatcher, IPaylodAction } from "../../core/interfaces/dispatchers";
import { ITableConfig } from "../../core/interfaces/models";

export interface IEITFeatureTableDispatcher extends IFeatureTableDispatcher {
    setMergedSyncFeatureTable(tabConfigs: Array<ITableConfig>): (dispatch: (data: IPaylodAction) => void) => void;
}