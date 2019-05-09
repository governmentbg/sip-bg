import * as React from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import { IEITAppConfig } from "../../interfaces/IEITAppConfig";
import { connect } from "react-redux";
import axios from "axios";
import OverlayLoader from "../../core/components/Loading/OverlayLoading";
import { mosaicLayoutDispatcher } from "../../core/actions/dispatchers";
import { IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
// import About from "./About";
import Toolbar from "./Toolbar";
import MapTab from "./MapTab";
import RibbonPanel from "./RibbonPanel";
import RibbonGroup from "./RibbonGroup";
import RegistryTool1Tab from "./RegistryTool1Tab";
import RegistryTool2Tab from "./RegistryTool2Tab";
import AdServicesTab from "./AdServicesTab";
import ProfileTab from "./ProfileTab";
import SystemLogsTab from './SystemLogsTab';
import About from './About';

import { nls } from "../nls";
import { IEITAppStore, IUserInfo, INotifyInfo } from '../../interfaces/reducers/IEITAppStore';
import { Badge } from 'react-bootstrap';



declare var __VERSION__DATE__: string;


interface InternalState {
    buildVersion?: string;
}
interface ParentProps{
}
interface OwnProps {
    userInfo: IUserInfo;
    loading: boolean;
    mobile: boolean;
    notifyInfo: INotifyInfo;
}

interface DispatchProps extends IMosaicLayoutDispatcher {
}

type Props = OwnProps & DispatchProps & ParentProps

class Ribbon extends React.Component<Props, InternalState> {
    constructor(props: Props) {
        super(props);
        this.state = {};
    }
    fetchBuildVersion = () : void => {
        // try {
        //     (axios.get('public/eit/BuildVersion.htm')).then((response: any) => {
        //         this.setState({
        //             buildVersion: response.data,
        //         });
        //     }).catch((error: Error) => { console.error(error); });
        // }
        // catch (e) {
        //     console.error(e);
        // }
        if (__VERSION__DATE__) {
            let versionStr = nls.nls.ribbon.versionString;
            this.setState({
                buildVersion: versionStr + __VERSION__DATE__,
            });
        }
    }
    componentDidMount(){
        this.fetchBuildVersion();
    }
    render() {
        return (
            <div className="esri-bg-ribbon">
                <OverlayLoader size="60px" show={this.props.loading}/>
                <Toolbar />
                <Tabs>
                    <TabList>
                        <Tab><span title={"Регистър на дейностите по чл. 39 ал.2 от ЗЕСМФИ"}>{nls.nls.ribbon.registry1.title}</span></Tab>
                        <Tab><span title={"Регистър на обявленията по чл. 20, ал. 4 от ЗЕСМФИ"}>{nls.nls.ribbon.registry2.title}</span></Tab>
                        <Tab>{nls.nls.ribbon.adServices}</Tab>
                        <Tab>{nls.nls.ribbon.map}</Tab>
                        {this.props.userInfo.username ? <Tab>{nls.nls.ribbon.profile}
                        {(this.props.userInfo.username && this.props.userInfo.roles.filter((r) => r === "EIT_Admin").length !== 0) &&
                        ((this.props.notifyInfo.newRegistrationRequestsCount && this.props.notifyInfo.newRegistrationRequestsCount !== 0) ||
                        (this.props.notifyInfo.new53Count && this.props.notifyInfo.new53Count !== 0))  ? 
                        <span style={{ height: 10,
                            width: 10,
                            backgroundColor: "#ff4646",
                            opacity:0.8,
                            verticalAlign:"top",
                            borderRadius: "50%",
                            display: "inline-block"}}></span> 
                        
                        : null}
                        </Tab> : null}
                        {(this.props.userInfo.username && this.props.userInfo.roles.filter((r) => r === "EIT_Admin").length !== 0) ? <Tab>{nls.nls.ribbon.systemLogging}</Tab> : null}
                        <Tab>{nls.nls.ribbon.about}</Tab>
                    </TabList>

                    <TabPanel>
                        <RegistryTool1Tab />
                    </TabPanel>
                    <TabPanel>
                        <RegistryTool2Tab />
                    </TabPanel>
                    <TabPanel>
                        <AdServicesTab />
                    </TabPanel>
                    <TabPanel>
                        <MapTab />
                    </TabPanel>     
                 
                    {this.props.userInfo.username ? <TabPanel forceRender={true}>
                    <ProfileTab/>
                    </TabPanel> : null}
                    {(this.props.userInfo.username && this.props.userInfo.roles.filter((r) => r === "EIT_Admin").length !== 0) ? <TabPanel forceRender={true}>
                    <SystemLogsTab mobile={this.props.mobile}/></TabPanel> : null}
                    <TabPanel>
                        <div style={{backgroundColor:"white"}}>
                            <RibbonPanel>
                                <About additionalData={this.state.buildVersion} />
                            </RibbonPanel>
                        </div>
                     </TabPanel>
                </Tabs>
            </div>
        )
    }
}
const mapStateToProps = (state: IEITAppStore) => ({
    userInfo: state.eit.userInfo,
    loading: !state.map.webMapImported, //|| state.gkf.gkfUI.registersLoading,
    mobile: state.application.mobile,
    notifyInfo: state.eit.notifyInfo,
})

export default connect<OwnProps, DispatchProps, ParentProps>(mapStateToProps, {...mosaicLayoutDispatcher})(Ribbon);