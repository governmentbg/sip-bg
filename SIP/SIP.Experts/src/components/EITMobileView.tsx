import * as React from 'react';

import { connect } from 'react-redux';
import MobileRibbonsWindow from '../core/enums/MobileRibbonsWindow';
import { IAppStore } from '../core/interfaces/reducers/IAppStore';
import { mobileRibbonsDispatcher } from '../core/actions/dispatchers';
import { IMobileRibbonsDispatcher } from '../core/interfaces/dispatchers';
import EITAppWindow from '../enums/EITAppWindow';
import { nls } from './nls';
import RegistryTool1Tab from "../components/Ribbon/RegistryTool1Tab";
import RegistryTool2Tab from "../components/Ribbon/RegistryTool2Tab";


interface OwnProps {
    visibleTab?: string;
}

interface DispatchProps extends IMobileRibbonsDispatcher {

}

interface ParentProps {
    getMosaicWindowInfo(title: string, path: any, props: any): {
        content: JSX.Element;
        props: {
            title: string;
            tools: React.ReactChild[];
            createNode: any;
            path: any;
            notFound?: boolean;
        };
    }
}

type Props = OwnProps & DispatchProps & ParentProps;

interface State {
    open: boolean;
}

class EITMobileView extends React.Component<Props, State> {
    sandwichHeight = "40px"
    constructor(props: Props & DispatchProps) {
        super(props);
        this.state = { open: false };
    }
    firstSandwichOpen = false;
    componentWillReceiveProps(props: Props & DispatchProps){
        if(props.visibleTab != "map"){
            this.setState({...this.state, open: (props.visibleTab != "__cache" && this.firstSandwichOpen)});
        }
    }

    tryGetMobileSpecificContent(contentKey: string): JSX.Element{
        switch(contentKey){
            case "actionsRegister":
                return <RegistryTool1Tab/>
            case "announcementsRegister":
                return <RegistryTool2Tab/>
            default:
                return <div></div>
        }
    }

    getCurrentContent(contentKey: string): JSX.Element {
        if(contentKey == "__index"){
            return <EITMobileViewIndexContainer />;
        }
        let mosaicWindoInfo = this.props.getMosaicWindowInfo(contentKey, "", {});
        if(mosaicWindoInfo.props.notFound){
            return <div className="eitMobileRibbonContent">{this.tryGetMobileSpecificContent(contentKey)}</div>
        }
        return mosaicWindoInfo.content
    }
    lastRendered: JSX.Element = <div></div>
    renderSandwich(): JSX.Element {
        let key = this.props.visibleTab || "__index";
        if(key != "map" && key != "__cache" && key != "__openCache"){
            this.lastRendered = this.state.open ? <div style={{height: `calc(100% - ${this.sandwichHeight})`, position: "relative"}}>
                {this.getCurrentContent(key)}
            </div> : <div></div>
        }
        
        return (
            <div className="eitMobileView" >
            <div style={{height: "42px", width: "100%"}}></div>
            {this.state.open ? <div style={{height: "100%", width: "100%", position: "fixed", background: "#1212124a"}}></div> : null}
                <div 
                className="eitMobileViewContent"
                style={{
                        maxWidth: this.state.open ? "80%" : this.sandwichHeight,
                        maxHeight: this.state.open ? "100%" : this.sandwichHeight,
                        overflow: "hidden",
                        bottom: this.state.open ? "0" : "",
                        borderRight: this.state.open ? "1px solid gray" : "",
                        boxShadow: this.state.open ? "2px 2px 2px grey" : ""
                    }}>
                    <div style={{display: "flex", justifyContent: "space-between"}}>
                        <img 
                            src="public/eit/sandwich-menu.svg" style={{height: "34px", width: "34px", margin: "3px"}}
                            onClick={() => {
                                if(this.state.open){
                                    this.setState({open: false });
                                }
                                else{
                                    this.firstSandwichOpen = true;
                                    this.setState({open: true });
                                }                       
                                }}/>
                        {this.state.open ? <img 
                            src="public/eit/home-menu.svg" style={{height: "34px", width: "34px", margin: "3px"}}
                            onClick={() => {  this.props.setVisibleRibbonTab("__index") }}/> : null}
                    </div>
                    {this.lastRendered}
                </div>
            </div>
        )
    }

    render() {
        return (
            <div className="MobileRibbons">
                {this.renderSandwich()}
                {this.props.children}
            </div>
        )
    }
}

const mapStateToProps = (state: IAppStore) => {
    return {
        visibleTab: state.mobileRibbons.visibleRibbonTab
    }
}

export default connect<OwnProps, DispatchProps, ParentProps>(mapStateToProps, { ...mobileRibbonsDispatcher })(EITMobileView);

interface IndexProps extends IMobileRibbonsDispatcher {

}

const EITMobileViewIndex = (props: IndexProps): JSX.Element => {
    return (
        <div style={{display: "flex", flexDirection: "column", overflow: "auto", height: "100%"}}>
            <MenuGroup groupName={nls.nls.ribbon.adServices} imageUrl={'public/eit/Services/S1_Infrastructure32.png'}>
                <ManuButton window={EITAppWindow.adService1Info} imageUrl={'public/eit/Services/S1_Infrastructure32.png'} setVisibleRibbonTab={props.setVisibleRibbonTab}/>
                <ManuButton window={EITAppWindow.adService2Info} imageUrl={'public/eit/Services/S2_Network32.png'} setVisibleRibbonTab={props.setVisibleRibbonTab}/>
                <ManuButton window={EITAppWindow.adService3Info} imageUrl={'public/eit/Services/S3_PlannedActivities32.png'} setVisibleRibbonTab={props.setVisibleRibbonTab}/>
                <ManuButton window={EITAppWindow.adService4Info} imageUrl={'public/eit/Services/S4_Contacts32.png'} setVisibleRibbonTab={props.setVisibleRibbonTab}/>
                <ManuButton window={EITAppWindow.adService51Info} imageUrl={'public/eit/Services/S51_ConstructionPermit32.png'} setVisibleRibbonTab={props.setVisibleRibbonTab}/>
                <ManuButton window={EITAppWindow.adService52Info} imageUrl={'public/eit/Services/S52_JointUsagePermit32.png'} setVisibleRibbonTab={props.setVisibleRibbonTab}/>
                <ManuButton window={EITAppWindow.adService53Info} imageUrl={'public/eit/Services/S53_NetworkRegistration32.png'} setVisibleRibbonTab={props.setVisibleRibbonTab}/>
            </MenuGroup>
            <MenuGroup groupName={nls.nls.ribbon.registers} imageUrl={'public/eit/Services/S1_Infrastructure32.png'}>
                <ManuButton window={"actionsRegister"} imageUrl={'public/eit/Ribbon/SearchAll32.png'} setVisibleRibbonTab={props.setVisibleRibbonTab}/>
                <ManuButton window={"announcementsRegister"} imageUrl={'public/eit/Ribbon/SearchAll32.png'} setVisibleRibbonTab={props.setVisibleRibbonTab}/>
            </MenuGroup>
        </div>
    )
}

export const EITMobileViewIndexContainer = connect<{}, IndexProps, {}>(null, {...mobileRibbonsDispatcher})(EITMobileViewIndex)


interface ManuButtonProps {
    imageUrl: string;
    window: string;
    setVisibleRibbonTab: (contentKey: string) => void;
}

class ManuButton extends React.Component<ManuButtonProps> {
    render(){
        return (
            <div style={{display: "flex"}} onClick={() => this.props.setVisibleRibbonTab(this.props.window)}>
                <img src={this.props.imageUrl} style={{marginRight: "5px"}}/>
                <div style={{whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{nls.nls.eitWidgetNames[this.props.window]}</div>
            </div>
        )
    }
}

class MenuGroup extends React.Component<{groupName: string, imageUrl: string}>{
    render(){
        return (
            <React.Fragment>
                <div className="menuTitle">
                    {this.props.groupName}
                </div>
                <div style={{padding: "10px"}}>
                    {this.props.children}
                </div>
            </React.Fragment>
        )
    }
}