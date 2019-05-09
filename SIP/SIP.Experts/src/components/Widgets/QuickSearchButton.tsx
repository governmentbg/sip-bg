import * as React from 'react';
import { connect } from 'react-redux';
import { IEITAppStore } from "../../interfaces/reducers/IEITAppStore";
import { IFeatureLayerInfo, ITableConfig, IMapView, IGeometry } from '../../core/interfaces/models';
import EITAppWindow from "../../enums/EITAppWindow";
import { tableDispatcher } from "../../core/actions/dispatchers";
import { mapDispatcher, mosaicLayoutDispatcher } from "../../core/actions/dispatchers";
import { IMapDispatcher, IFeatureTableDispatcher, IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import RibbonButton from '../Ribbon/RibbonButton';
import { Geometry } from 'esri/geometry';

type searchType = "map" | "all" | "custom" // when is custom, props.geometry is readed

interface OwnProps {
    layerInfos: { [url: string]: IFeatureLayerInfo };
    mapView: IMapView;
}

interface ParentProps {
    serviceUrl: string;
    searchType: searchType;
    searchWhere?: string;
    orderByFields?: Array<string>; 
    imageUrl?: string;
    title?: string;
    tableTitle?: string;
    tooltip?: string;
    vertical?: boolean;
    size?: "S" | "M" | "L";
    classNames?: string;
    geometry?: any; // searchType need to be 'custom'
    disabled?: boolean;
    forceColumns?: Array<string>;
}

interface DispatchProps extends IMapDispatcher, IFeatureTableDispatcher, IMosaicLayoutDispatcher {

}

type Props = DispatchProps & ParentProps & OwnProps;

const QuickSearchButton = (props: Props) => {

    const getTableConfig = (geometry?: IGeometry): ITableConfig => {
        let layerInfo = props.layerInfos[props.serviceUrl];
        if (!layerInfo) {
            throw new Error(`${props.serviceUrl} not found. Please check failed and denied services`);
        }
        return {
            query: {
                outFields: ["*"],
                where: props.searchWhere === undefined ? "1=1" : props.searchWhere,
                geometry: geometry,
                orderByFields: props.orderByFields ===  undefined ? ['objectid desc'] : [props.orderByFields.join(',')]
            },
            title: props.tableTitle || undefined, // layerInfo.title,
            id: layerInfo.url,
            selectedIds: {}, // if not specified the table will not be selectable
            forceColumns: props.forceColumns,
        };
    }

    const showAndLoadTables = (tableConfig: ITableConfig) => {
        props.removeTabs([], []);
        props.showWindow(EITAppWindow.tables, 60, true);
        props.setTableVisibility({ [tableConfig.id]: tableConfig.id });
        props.setAsyncFeatureTableTabData([tableConfig]);
    }

    const handleClick = () => {
        showAndLoadTables(getTableConfig((props.searchType == "map" ? props.mapView.getExtent() : (props.searchType == "custom" ? props.geometry : undefined))))
    }

    return (
        <RibbonButton usedClassesForImage={props.classNames} clickHandler={handleClick} imageUrl={props.imageUrl ? props.imageUrl : "public/icons/pixels.svg"} tooltip={props.tooltip}
            vertical={props.vertical} size={props.size} disabled={props.disabled || false}>
            {props.title}
        </RibbonButton>
    )
}

const mapStateToProps = (state: IEITAppStore) => ({
    layerInfos: state.layerInfos.featureLayerInfos,
    mapView: state.map.mapView
})

export default connect<OwnProps, DispatchProps, ParentProps>(mapStateToProps, { ...mapDispatcher, ...tableDispatcher, ...mosaicLayoutDispatcher })(QuickSearchButton)
