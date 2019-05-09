import * as React from "react";
import ReactTable, { FinalState, RowInfo } from 'react-table';
import { connect } from 'react-redux';
import { IEITAppStore, IUserInfo } from "../../interfaces/reducers/IEITAppStore";
import OverlayLoader from "../../core/components/Loading/OverlayLoading";
import { nls } from "../nls";
import { mapDispatcher } from "../../core/actions/dispatchers";
import { IMapDispatcher } from "../../core/interfaces/dispatchers";
import { eitAppConfig } from "../../eitAppConfig";
import { IGraphic, IGeometry, IFeatureLayerInfo, ITableConfig, } from '../../core/interfaces/models';
import { IColumn } from '../../core/interfaces/reducers/IAttributeTable';
import { TableInfo } from '../../core/models/TableInfo';
import FeatureTable from "../../core/components/AttributeTable/FeatureTable";
import PaginationLite from '../../core/components/AttributeTable/Paginations/PaginationLite';
import { featureLayersAPI, graphicHasAllFields } from "../../core/actions/helpers";
import { getLayerInfos } from "../../core/reducers/layerInfos";
import { getFieldValue } from "../../core/actions/helpers";
import ExportXml from '../../core/components/AttributeTable/Paginations/Tools/ExportXml';
import EITFeatureTable from '../AttributeTable/EITFeatureTable';
import DetailView from '../../core/components/DetailView/DetailView';
import { FeatureTableInfo } from '../../core/models/FeatureTableInfo';

interface InternalState {
    graphic?: IGraphic;
    data: Array<IGraphic>;
}

interface ParentProps {
    featureLayerInfoId: string;
    graphic?: IGraphic;
    where: string;
    onLoadingChange?: (loading: boolean) => void,
}

interface OwnProps {
    loading: boolean;
    layerInfos: { [url: string]: IFeatureLayerInfo };
    isAdmin: Readonly<boolean>;
}

interface DispatchProps extends IMapDispatcher {
}

type Props = DispatchProps & OwnProps & ParentProps;

class ServiceSpatialResult extends React.Component<Props, InternalState> {
    constructor(props: Props) {
        super(props);
        this.state = {
            graphic: undefined,
            data: [],
        }
    }

    componentWillMount() {
        this.setState({
            data: [],
        });
        if (this.props.featureLayerInfoId) {
            this.getData(this.props.graphic);
        }
    }
    componentWillReceiveProps(props: Props) {
        if (props.featureLayerInfoId && props.graphic != this.state.graphic) {
            this.setState({
                graphic: props.graphic,
            });
            this.getData(props.graphic);
        }
    }

    getResultColummns = (): Array<IColumn> => {
        let columns: Array<IColumn> = [];
        let preview = eitAppConfig.layersConfig[this.props.featureLayerInfoId].preview;
        let featureLayerInfo: IFeatureLayerInfo = getLayerInfos()[this.props.featureLayerInfoId]
        for (let fieldIndex in preview) {
            if (preview[fieldIndex] == "siteurl") {
                columns.push({
                    id: preview[fieldIndex],
                    accessor: (g: IGraphic) => getFieldValue(featureLayerInfo.popupInfo.fieldInfos[preview[fieldIndex]], g.attributes[preview[fieldIndex]]),
                    Header: featureLayerInfo.popupInfo.fieldInfos[preview[fieldIndex]].label,
                    Cell: (cellInfo) => {
                        return <a href={cellInfo.original.attributes["siteurl"]} target="_blank">{cellInfo.value}</a>
                    }
                });
            }
            else {
                columns.push({
                    id: preview[fieldIndex],
                    accessor: (g: IGraphic) => getFieldValue(featureLayerInfo.popupInfo.fieldInfos[preview[fieldIndex]], g.attributes[preview[fieldIndex]]),
                    Header: featureLayerInfo.popupInfo.fieldInfos[preview[fieldIndex]].label,
                });
            }
        }
        return columns;
    }

    getData = (graphic?: IGraphic): void => {
        this.setState({
            data: []
        });
        if (!graphic) {
            return;
        }
        this.onLoading(true);
        featureLayersAPI.execute(getLayerInfos()[this.props.featureLayerInfoId], {
            geometry: graphic.geometry,
            where: this.props.where,
            outFields: ["*"],
            returnGeometry: true,
        }).then(result => {
            this.onLoading(false);
            this.setState({
                data: result,
            });
        }).catch(e => {
            this.onLoading(false);
            console.error(e);
        })
    }

    getServiceResultTableInfo = (data: Array<IGraphic>): FeatureTableInfo => {
        let columns: Array<IColumn> = this.getResultColummns();
        //console.log("Columns: ", columns);
        let tableInfo = new FeatureTableInfo(this.props.featureLayerInfoId, "Резултат", columns, "objectid");
        tableInfo.data = data;
        return tableInfo
    }
    onLoading = (loading: boolean): void => {
        if (this.props.onLoadingChange) {
            this.props.onLoadingChange(loading);
        }
    }

	protected getTdProps(tableInfo: FeatureTableInfo) {
		return (state: FinalState, rowInfo: RowInfo, column: any, instance: ReactTable) => {
			if(!column.id || column.id.indexOf("$") != 0){
				return ({
					onClick: (e: any, c: any) => {
						if (rowInfo && (rowInfo.viewIndex || rowInfo.viewIndex == 0)) {
                            let expanded = state.expanded ? state.expanded : {};
							if(expanded[rowInfo.viewIndex]){
								delete expanded[rowInfo.viewIndex];
							}
							else{
								expanded[rowInfo.viewIndex] = {};
							}
							instance.setState({ ...state, expanded })
						}
					},
					style: {
						cursor: "pointer"
					}
				})
			}
			else{
				return {};
			}
		}
	}

    render() {
        let tableInfo=this.getServiceResultTableInfo(this.state.data);
        return (
            <EITFeatureTable
                tableInfo={tableInfo}
                reactTableProps={{
                    PaginationComponent: (props: Partial<FinalState>) =>
                        <PaginationLite {...props} 
                        tools={[<ExportXml title={nls.nls.table.exportXML} isAdmin={this.props.isAdmin} selectedIds={tableInfo.selectedIds || {}} key={1} table={tableInfo} btnClassName="appBtn" showText={true}/>]} 
                        maxInlineTools={4} 
                        tableId={this.props.featureLayerInfoId} />,
                    defaultPageSize: 15,
                    getTdProps: this.getTdProps(tableInfo)
                }}
                showDetail={true} 
                zoomTo={this.props.zoomTo} 
                reportError={() => { }}
                setSelected={() => {}}
                isSelected={() =>  false}
                toggleSelectAll = {() => {}} />
        );
    }
}

const mapStateToProps = (state: IEITAppStore) => ({
    layerInfos: state.layerInfos.featureLayerInfos,
    loading: !state.map.webMapImported,
    isAdmin: state.eit.userInfo.isAdmin,
})

export default connect<OwnProps, DispatchProps, any>(mapStateToProps, { ...mapDispatcher, })(ServiceSpatialResult);
