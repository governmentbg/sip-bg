
import { IFeatureLayerInfo } from "../../core/interfaces/models";
import { IPaylodAction, IFeatureTableDispatcher } from "../../core/interfaces/dispatchers";
import { FeatureTableInfo } from "../../core/models/FeatureTableInfo";
import ErrorActions from "../../core/enums/ActionTypes/ErrorActions";
import { IColumn } from "../../core/interfaces/reducers/IAttributeTable";
import { getLayerInfos } from '../../core/reducers/layerInfos';
import { getAllTabInfos } from '../../core/reducers/attributeTable';
import TableActions from "../../core/enums/ActionTypes/TableActions";
import { TableDispatcher } from "../../core/actions/common/dispatchers/featureTables";
import { IQuery, IGraphic, ITableConfig, IExtent } from "../../core/interfaces/models";
import { getMapExtent } from "../../core/reducers/map";
import { featureLayersAPI } from "../../core/actions/helpers";
import { getFieldValue } from "../../core/actions/helpers";
import { eitAppConfig } from "../../eitAppConfig";
import { IEITFeatureTableDispatcher } from "../../interfaces/dispatchers/IEITFeatureTableDispatcher";

interface ITabInfoPayload {
	[key: string]: FeatureTableInfo;
}


export class EITTableDispatcher extends TableDispatcher implements IEITFeatureTableDispatcher {
	constructor() {
		super();
		this.setMergedSyncFeatureTable = this.setMergedSyncFeatureTable.bind(this);
	}

	public setMergedSyncFeatureTable(tabConfigs: Array<ITableConfig>) {
		return (dispatch: (data: IPaylodAction) => void) => {
			if(tabConfigs.length == 0){
				return;
			}
			dispatch({
				type: TableActions.START_LOADING,
				payload: true
			});
			let tabInfos: FeatureTableInfo[] = [];
			let loadingTables = {};
			let removeIfEmptyIds: { [key: string]: string } = {};
			let ids = {};
			try {
				tabConfigs.forEach(tc => {
					ids[tc.id] = tc.id;
					let tabInfo = this.ensureAndUpdateFeatureTableInfo(tc);
					if(!tc.ignoreEmptyResults) {
						tabInfo.loading = true;
						loadingTables[tabInfo.id] = tabInfo;
					}
					else{
						removeIfEmptyIds[tc.id] = tc.id;
					}
					tabInfos.push(tabInfo);
				})
			}
			catch (error) {
				dispatch({
					type: ErrorActions.ERROR,
					payload: error
				});
				return;
			}
			
			dispatch({
				type: TableActions.SET_TABLES_VISIBILITY,
				payload: ids
			});
			if(Object.keys(loadingTables).length > 0){
				dispatch({
					type: TableActions.SEND_LOADING_TABLES,
					payload: loadingTables[0]
				});
			}
			let promiseContainers: Array<{promise: Promise<FeatureTableInfo>, tableInfo: FeatureTableInfo}> = [this.getMergePromise(tabInfos)];
			
			//if tables with no data will be removed? - then we resolve them all and filter before dispatching 
			if(Object.keys(removeIfEmptyIds).length > 0){
				dispatch({
					type: TableActions.SEND_LOADING_TABLES,
					payload: loadingTables[0]
				});
				this.resolveSyncTableInfoPromises(promiseContainers).then(result => {		
					this.ClearEmptyResults(dispatch, removeIfEmptyIds, result);	
					dispatch({
						type: TableActions.ADD_QUERY_SYNC_TABS,
						payload: result
					});
				})
			}
			else{
				promiseContainers.forEach(promiseContainer => {
					this.resolveSyncTableInfoPromise(promiseContainer).then(tableInfo => {
						dispatch({
							type: TableActions.ADD_QUERY_SYNC_TABS,
							payload: { [tableInfo.id]: tableInfo }
						});
					})
				})
			}
			
			
			
			this.resolveSyncTableInfoPromises(promiseContainers).then(result => {		
				dispatch({
					type: TableActions.STOP_LOADING,
					payload: false
				});
			})
		}
	}

	protected getMergePromise(tabInfos: Array<FeatureTableInfo>)
		: {promise: Promise<FeatureTableInfo>, tableInfo: FeatureTableInfo} {
			let tabInfoPromises: Array<Promise<FeatureTableInfo>> = [];
			tabInfos.forEach(tableInfo => {
				tabInfoPromises.push(new Promise((resolve, reject) => {
					let layerInfo = getLayerInfos()[this.clearLayerKey(tableInfo.id)];
					if(layerInfo.supportsQuery){
						featureLayersAPI.execute(layerInfo, tableInfo.query)
						.then((res: Array<IGraphic>) => {
							let data: Array<IGraphic> = res ? res : [];
							let newTabInfo = FeatureTableInfo.FromTableInfoProps({ ...tableInfo, data: data, recordsCount: data.length });
							resolve(newTabInfo);
						})
						.catch((error: Error) => {
							reject(error);
						});
					}
					else{
						reject(new Error("No query task exsists in this layer"))
					}
	
				}) as Promise<FeatureTableInfo>)
			})
			return {
				promise: new Promise((resolve, reject) => {
					Promise.all(tabInfoPromises).then(result => {
						let mergedTableInfo: FeatureTableInfo = tabInfos[0];
						result.forEach(r => {
							mergedTableInfo.data = mergedTableInfo.data.concat(r.data)
						})
						resolve(mergedTableInfo)
					})
				}),
				tableInfo: tabInfos[0]
			}
	}
}


export const eitFeatureTables = new EITTableDispatcher() as IEITFeatureTableDispatcher;
