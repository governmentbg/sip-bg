import * as React from 'react';
import RibbonPanel from "./RibbonPanel";
import RibbonGroup from "./RibbonGroup";
import { nls } from "../nls";
import { eitAppConfig } from "../../eitAppConfig";
import SendForEditingButton from "../Widgets/SendForEditingButton";
import { IEITAppStore, IUserInfo } from '../../interfaces/reducers/IEITAppStore';
import { connect } from 'react-redux';
import Registry1SearchGroup from './Registry1SearchGroup';
import { tableDispatcher, mosaicLayoutDispatcher } from "../../core/actions/dispatchers";
import { IFeatureTableDispatcher, IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import EITAppWindow from '../../enums/EITAppWindow';
import IdentifyTools from '../Widgets/IdentifyTools';
import { ITableConfig } from '../../core/interfaces/models';
import { activateMap } from '../../actions/dispatchers/eitMapDispatcher';
import { IMapAction } from '../../interfaces/dispatchers/IMapActions';

interface OwnProps {
    userInfo: IUserInfo,
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
class RegistryTool1Tab extends React.Component<Props, State> {
    constructor(props: Props){
        super(props);
        // if(props.webmapImported){
        //     this.callRegisterTable();
        // }
    }

    componentWillMount() {
        if (!this.props.isMapActive) {
            this.props.activateMap(true);
        }
    }

    componentWillReceiveProps(props: Props){
        if(props.webmapImported && !props.mobile){
            this.callRegisterTable();
        }
    }

    componentDidMount() {
        if(this.props.webmapImported && !this.props.mobile){
            this.callRegisterTable();
        }
    }

    callRegisterTable(){
        let tableConfig: ITableConfig = {
            id: eitAppConfig.layers.Register1ServiceUrl,
            selectedIds: {},
            query: { where:"1=1", orderByFields: ["objectid desc"], outFields: ["*"]}
        }
        this.props.removeTabs([], []);
        this.props.showWindow(EITAppWindow.tables, 60, true);
        this.props.setTableVisibility({[tableConfig.id]: tableConfig.id});
        this.props.setAsyncFeatureTableTabData([tableConfig]);
    }

    render() {
        return (
            <RibbonPanel>
                <RibbonGroup mobile={this.props.mobile} groupName="Описание">
                    <span className="ribbon-descriptions" dangerouslySetInnerHTML={{ __html: nls.nls.ribbon.registry1.description }} />
                </RibbonGroup>
                {this.props.userInfo.username && !this.props.userInfo.isRegulator ? <RibbonGroup mobile={this.props.mobile} groupName="Създаване">
                    <SendForEditingButton title={nls.nls.ribbon.registry1.createNewАctivity}
                        imageUrl="public/eit/Ribbon/AddFeature32.png"
                        serviceUrl={eitAppConfig.layers.RegistersFeatureActions} 
                        vertical={true}/>
                </RibbonGroup> : null}
                <RibbonGroup mobile={this.props.mobile} groupName="Търсене">          
                   <Registry1SearchGroup />   
                </RibbonGroup>
                <RibbonGroup mobile={this.props.mobile} groupName="Идентификация">
                  <IdentifyTools vertical={true} sizeOfButtons={"S"}/>
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

export default connect<OwnProps, DispatchProps, ParentProps>(mapStateToProps, {...tableDispatcher, ...mosaicLayoutDispatcher, activateMap})(RegistryTool1Tab)