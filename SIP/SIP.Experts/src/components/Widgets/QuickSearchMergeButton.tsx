import * as React from 'react';
import { connect } from 'react-redux';
import { IEITAppStore } from "../../interfaces/reducers/IEITAppStore";
import { IFeatureLayerInfo, ITableConfig, IMapView, IGeometry } from '../../core/interfaces/models';
import EITAppWindow from "../../enums/EITAppWindow";
import { eitFeatureTables } from "../../actions/dispatchers/eitFeatureTables";
import { IEITFeatureTableDispatcher } from "../../interfaces/dispatchers/IEITFeatureTableDispatcher";
import { mapDispatcher, mosaicLayoutDispatcher } from "../../core/actions/dispatchers";
import { IMapDispatcher, IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import RibbonButton from '../Ribbon/RibbonButton';
import { Geometry } from 'esri/geometry';
import { string } from 'prop-types';

type searchType = "map" | "all" | "custom" // when is custom, props.geometry is readed

interface OwnProps {
    layerInfos: { [url: string]: IFeatureLayerInfo };
    mapView: IMapView;
}

interface ParentProps {
    serviceUrls: Array<string>;
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
}

interface DispatchProps extends IMapDispatcher, IEITFeatureTableDispatcher, IMosaicLayoutDispatcher {

}

type Props = DispatchProps & ParentProps & OwnProps;

const QuickSearchMergeButton = (props: Props) => {

    const getTablesConfig = (geometry?: IGeometry): Array<ITableConfig> => {
        let layerInfos: Array<ITableConfig> = [];
        props.serviceUrls.forEach(url => {
            let l = props.layerInfos[url];
            if (!l) {
                console.warn(`${url} not found. Please check failed and denied services`);
            }
            else {
                layerInfos.push({
                    query: {
                        outFields: ["*"],
                        where: props.searchWhere === undefined ? "1=1" : props.searchWhere,
                        geometry: geometry,
                        orderByFields: props.orderByFields === undefined ? ['objectid desc'] : [props.orderByFields.join(',')]
                    },
                    title: props.tableTitle || l.title,
                    id: l.url,
                    selectedIds: [] // if not specified the table will not be selectable
                });
            }
        })
        return layerInfos;
    }

    const showAndLoadTables = (tablesConfig: Array<ITableConfig>) => {
        props.removeTabs([], []);
        props.showWindow(EITAppWindow.tables, 60, true);
        props.setTableVisibility({ [tablesConfig[0].id]: tablesConfig[0].id });
        props.setMergedSyncFeatureTable(tablesConfig);// call sync query. this way the table will merge all result.
    }

    const handleClick = () => {
        showAndLoadTables(getTablesConfig((props.searchType == "map" ? props.mapView.getExtent() : (props.searchType == "custom" ? props.geometry : undefined))))
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

export default connect<OwnProps, DispatchProps, ParentProps>(mapStateToProps, { ...mapDispatcher, ...eitFeatureTables, ...mosaicLayoutDispatcher })(QuickSearchMergeButton)
