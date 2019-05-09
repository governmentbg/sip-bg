import * as React from 'react';
import { connect } from 'react-redux';

import { showServicePreview } from '../../actions/dispatchers/serviceActionDispatcher';
import { IServiceActionDispatcher } from '../../interfaces/dispatchers/IServiceActionDispatcher';
import { mosaicLayoutDispatcher } from "../../core/actions/dispatchers";
import { IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import EITAppWindow from '../../enums/EITAppWindow';
import { toggleWindow } from "../../actions/helpers/toggleWindowHelper";
import { nls } from '../nls';

interface InternalState {
}

interface OwnProps {
}

interface ParentProps {
    cellInfo: any,
}

interface DispatchProps extends IMosaicLayoutDispatcher, IServiceActionDispatcher {
}


type Props = OwnProps & ParentProps & DispatchProps;

class ServicePreviewButton extends React.Component<Props, InternalState> {

    constructor(props: Props) {
        super(props);
        this.state = {
        };
    }

    render() {
        return (
            <img style={{
                height: "25px", width: "25px",
                opacity: 1, //  (cellInfo.original.geometry ? 1 : 0.5),
                cursor: "pointer", // (cellInfo.original.geometry ? "pointer" : "")
            }} title={nls.nls.serviceWizard.servicePreview}
                src="public/eit/Services/ServicePreview32.png"
                onClick={() => {
                    this.props.showServicePreview({
                        serviceCode: this.props.cellInfo.original.attributes.service_id,
                        serviceOID: this.props.cellInfo.original.attributes.service_objectid,
                        incomingnumber: this.props.cellInfo.original.attributes.incomingnumber,
                        serviceparameters: this.props.cellInfo.original.attributes.serviceparameters,
                        attributes: this.props.cellInfo.original.attributes,
                    });
                    toggleWindow(this.props, EITAppWindow.servicePreview);
                }} />
        );
    }
}

export default connect<OwnProps, DispatchProps, ParentProps>(null, { ...mosaicLayoutDispatcher, showServicePreview })(ServicePreviewButton);