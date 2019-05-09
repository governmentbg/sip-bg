import * as React from 'react';
import RibbonButton from "./RibbonButton";
import RibbonPanel from "./RibbonPanel";
import RibbonGroup from "./RibbonGroup";
import QuickSearchButton from "../Widgets/QuickSearchButton";
import { eitAppConfig } from "../../eitAppConfig";
import { nls } from "../nls";
import { connect } from 'react-redux';
import { IEITAppStore, IUserInfo } from '../../interfaces/reducers/IEITAppStore';
import SendForEditingButton from "../Widgets/SendForEditingButton";
import Registry2SearchGroup from './Registry2SearchGroup';
import { tableDispatcher, mosaicLayoutDispatcher } from "../../core/actions/dispatchers";
import { IFeatureTableDispatcher, IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import EITAppWindow from '../../enums/EITAppWindow';
import { ITableConfig } from '../../core/interfaces/models';
import { activateMap } from '../../actions/dispatchers/eitMapDispatcher';
import { IMapAction } from '../../interfaces/dispatchers/IMapActions';

interface OwnProps {
    userInfo: IUserInfo;
    webmapImported: boolean;
    isMapActive: boolean;
    mobile: boolean;
}

interface ParentProps {

}

interface DispatchProps extends IFeatureTableDispatcher, IMosaicLayoutDispatcher, IMapAction {

}

type Props = DispatchProps & ParentProps & OwnProps;

interface State {

}

class RegistryTool2Tab extends React.Component<Props, State> {
    constructor(props: Props){
        super(props);
        setTimeout(() => {
            if (this.props.isMapActive) {
                this.props.activateMap(false);
                this.props.showWindow(EITAppWindow.map)
            } else {
                this.props.activateMap(true);
                this.props.showWindow(EITAppWindow.map)
            }
        }, 100)
    }

    // componentWillReceiveProps(props: Props){
        // if(props.webmapImported){
            // this.callRegisterTable();
        // }
    // }

    // componentWillMount() {
    //     if (this.props.isMapActive) {
    //         this.props.activateMap(false);
    //     } else {
    //         this.props.activateMap(true);
    //     }
    // }

    // componentDidMount() {
        // setTimeout(() => {
            // this.callRegisterTable();
        // }, 500);
    // }

    // componentWillMount() {
    //     setTimeout(() => {
    //         this.callRegisterTable();
    //     }, 5);
    // }

    componentWillReceiveProps(props: Props) {
        if(props.webmapImported && !props.mobile){
            this.callRegisterTable();
        }
    }

    componentWillUnmount() {
        this.props.activateMap(true);
        setTimeout(() => {
            if (this.props.isMapActive) {
                this.props.showWindow(EITAppWindow.map);
            } else {
                this.props.activateMap(true);
                this.props.showWindow(EITAppWindow.map);
            }
        }, 100);
    }

    callRegisterTable(){
        let tableConfig: ITableConfig = {
            id: eitAppConfig.layers.Register2ServiceUrl,
            selectedIds: {}
        }
        this.props.removeTabs([], []);
        this.props.showWindow(EITAppWindow.tables, 60, true);
        this.props.setTableVisibility({[tableConfig.id]: tableConfig.id});
        this.props.setAsyncFeatureTableTabData([tableConfig]);
    }

    render(){
        return (
            <RibbonPanel>
                <RibbonGroup groupName="Описание" mobile={this.props.mobile}>
                    <span className="ribbon-descriptions" dangerouslySetInnerHTML={{ __html: nls.nls.ribbon.registry2.description }} />
                </RibbonGroup>
                {this.props.userInfo.username && !this.props.userInfo.isRegulator ? <RibbonGroup mobile={this.props.mobile} groupName="Създаване">
                    <SendForEditingButton title={nls.nls.ribbon.registry2.createNewАnnouncement}
                        imageUrl="public/eit/Ribbon/AddFeature32.png"
                        serviceUrl={eitAppConfig.layers.RegistersFeatureJoint} 
                        vertical={true}/>
                </RibbonGroup> : null}
                <RibbonGroup mobile={this.props.mobile} groupName="Търсене">
                <Registry2SearchGroup />   
                </RibbonGroup>
            </RibbonPanel>
        );
    }
}

const mapStateToProps = (state: IEITAppStore) => ({
    userInfo: state.eit.userInfo,
    webmapImported: state.map.webMapImported,
    isMapActive: state.eit.eitMap.isMapActive,
    mobile: state.application.mobile
})

export default connect<OwnProps, DispatchProps, ParentProps>(mapStateToProps,  {...tableDispatcher, ...mosaicLayoutDispatcher, activateMap})(RegistryTool2Tab)