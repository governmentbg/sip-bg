import * as React from 'react';
import { connect } from 'react-redux';
import { IEITAppStore } from "../../interfaces/reducers/IEITAppStore";
import { IFeatureLayerInfo, ITableConfig, IMapView, IGeometry } from '../../core/interfaces/models';
import EITAppWindow from "../../enums/EITAppWindow";
import { mapDispatcher, tableDispatcher, mosaicLayoutDispatcher } from "../../core/actions/dispatchers";
import { IMapDispatcher, IFeatureTableDispatcher, IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import { DrawType } from '../../core/enums/DrawType';
import RibbonButton from '../Ribbon/RibbonButton';
import { Polygon } from 'esri/geometry';

interface OwnProps {
    layerInfos: {[url: string]: IFeatureLayerInfo};
    mapView: IMapView;
}

interface ParentProps {
    serviceUrl: string;
    drawType: DrawType;
    searchWhere?: string;
    imageUrl?: string;
    title?: string;
    tooltip?: string;
    vertical?: boolean;
    size?: "S" | "M" | "L";
}

interface DispatchProps extends IMapDispatcher, IFeatureTableDispatcher, IMosaicLayoutDispatcher {

}

type Props = DispatchProps & ParentProps & OwnProps;

const QuickSearchMapTool = (props: Props) => {

    const getTableConfig = (geometry?: IGeometry): ITableConfig => {
        let layerInfo = props.layerInfos[props.serviceUrl];
        if(!layerInfo){
            throw new Error(`${props.serviceUrl} not found. Please check failed and denied services`);
        }
        return {
            query: {
                outFields: ["*"],
                where: props.searchWhere === undefined ? "1=1" : props.searchWhere,
                geometry: geometry
            },
            title: layerInfo.title,
            id: layerInfo.url,
            selectedIds: {} // if not specified the table will not be selectable
        };
    }

    const showAndLoadTables = (tableConfig: ITableConfig) => {
        props.removeTabs([], []);
        props.showWindow(EITAppWindow.tables);
        props.setTableVisibility({[tableConfig.id]: tableConfig.id});
        props.setQuerySyncFeatureTable([tableConfig]);
    }

    const handleClick = () => {
        props.activateDraw(props.drawType, true, () => { }, (geometry: IGeometry) => {
            console.log(geometry)
            if(!(geometry as any).isSelfIntersecting){
                showAndLoadTables(getTableConfig(geometry))
            }
        })
    }

    return (
        <RibbonButton clickHandler={handleClick} imageUrl={props.imageUrl ? props.imageUrl : "public/icons/pixels.svg"} tooltip={props.tooltip}
            vertical={props.vertical} size={props.size}>
            {props.title}
        </RibbonButton>
    )
}

const mapStateToProps = (state: IEITAppStore) => ({
    layerInfos: state.layerInfos.featureLayerInfos,
    mapView: state.map.mapView
})

export default connect<OwnProps, DispatchProps, ParentProps>(mapStateToProps, {...mapDispatcher, ...tableDispatcher, ...mosaicLayoutDispatcher})(QuickSearchMapTool)
