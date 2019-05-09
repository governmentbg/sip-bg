import * as React from 'react';
import { connect } from 'react-redux';
import { IEITAppStore } from "../../interfaces/reducers/IEITAppStore";
import { IFeatureLayerInfo, ITableConfig, IMapView, IGeometry, IGraphic } from '../../core/interfaces/models';
import EITAppWindow from "../../enums/EITAppWindow";
import { editsDispatcher, mosaicLayoutDispatcher } from "../../core/actions/dispatchers";
import { IEditsDispatcher, IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import RibbonButton from '../Ribbon/RibbonButton';
import { createNewGraphic } from "../../core/actions/helpers";
import { getLayerInfos } from "../../core/reducers/layerInfos";

interface OwnProps {

}

interface ParentProps {
    serviceUrl: string;
    imageUrl?: string;
    title?: string;
    tooltip?: string;
    graphic?: IGraphic;
    vertical?: boolean;
    size?: "S" | "M" | "L";
}

interface DispatchProps extends IMosaicLayoutDispatcher, IEditsDispatcher {

}

type Props = DispatchProps & ParentProps & OwnProps;

const SendForEditingButton = (props: Props) => {
    return (
        <RibbonButton clickHandler={() => {
            props.setSingleEditorNewData(props.serviceUrl, props.graphic ? props.graphic : createNewGraphic(getLayerInfos()[props.serviceUrl]))
            props.showWindow(EITAppWindow.detailEditing)
        }} imageUrl={props.imageUrl ? props.imageUrl : "public/icons/pixels.svg"} tooltip={props.tooltip} vertical={props.vertical} size={props.size}>
            {props.title}
        </RibbonButton>
    )
}

export default connect<OwnProps, DispatchProps, ParentProps>(null, { ...mosaicLayoutDispatcher, ...editsDispatcher })(SendForEditingButton)
