import * as React from 'react';
import { connect } from "react-redux";
import RibbonPanel from "./RibbonPanel";
import RibbonGroup from "./RibbonGroup";
import ToggleWindowRibbonButton from '../Widgets/ToggleWindowRibbonButton';
import EITAppWindow from '../../enums/EITAppWindow';
import { IEITAppStore, IUserInfo } from '../../interfaces/reducers/IEITAppStore';
import { nls } from "../nls";
import { activateMap } from '../../actions/dispatchers/eitMapDispatcher';
import { IMapAction } from '../../interfaces/dispatchers/IMapActions';

interface ParentProps {
}

interface OwnProps {
    loading: boolean;
    userInfo: IUserInfo;
    isMapActive: boolean;
    mobile: boolean;
}

interface DispatchProps extends IMapAction {
}

type Props = OwnProps & ParentProps & DispatchProps;

class AdServicesTab extends React.Component<Props, {}> {
    //constructor(props: Props) {
    //    super(props);
    //this.props = { loading: false, userInfo:{username:'', roles:[], privilege: '', token:'', expires: undefined, }}
    //}

    componentWillMount() {
        if (!this.props.isMapActive) {
            this.props.activateMap(true);
        }
    }

    render() {
        return (
            <RibbonPanel>
                <RibbonGroup groupName="Заявяване" mobile={this.props.mobile}>
                    <ToggleWindowRibbonButton window={EITAppWindow.adService1Info}
                        imageUrl={'public/eit/Services/S1_Infrastructure32.png'}
                        size="M"
                        vertical={true}
                        tooltip={nls.nls.serviceWizard.widgetCommonTooltip + nls.nls.ribbon.adService1.description} />
                    <ToggleWindowRibbonButton window={EITAppWindow.adService2Info}
                        imageUrl={'public/eit/Services/S2_Network32.png'}
                        size="M"
                        vertical={true}
                        tooltip={nls.nls.serviceWizard.widgetCommonTooltip + nls.nls.ribbon.adService2.description} />
                    <ToggleWindowRibbonButton window={EITAppWindow.adService3Info}
                        imageUrl={'public/eit/Services/S3_PlannedActivities32.png'}
                        size="M"
                        vertical={true}
                        tooltip={nls.nls.serviceWizard.widgetCommonTooltip + nls.nls.ribbon.adService3.description} />
                    <ToggleWindowRibbonButton window={EITAppWindow.adService4Info}
                        imageUrl={'public/eit/Services/S4_Contacts32.png'}
                        size="M"
                        vertical={true}
                        tooltip={nls.nls.serviceWizard.widgetCommonTooltip + nls.nls.ribbon.adService4.description} />

                    <ToggleWindowRibbonButton window={EITAppWindow.adService51Info}
                        imageUrl={'public/eit/Services/S51_ConstructionPermit32.png'}
                        size="M"
                        vertical={true}
                        tooltip={nls.nls.serviceWizard.widgetCommonTooltip + nls.nls.ribbon.adService51.description} />

                    <ToggleWindowRibbonButton window={EITAppWindow.adService52Info}
                        imageUrl={'public/eit/Services/S52_JointUsagePermit32.png'}
                        size="M"
                        vertical={true}
                        tooltip={nls.nls.serviceWizard.widgetCommonTooltip + nls.nls.ribbon.adService52.description} />

                    <ToggleWindowRibbonButton window={EITAppWindow.adService53Info}
                        imageUrl={'public/eit/Services/S53_NetworkRegistration32.png'}
                        size="M"
                        vertical={true}
                        tooltip={nls.nls.serviceWizard.widgetCommonTooltip + nls.nls.ribbon.adService53.description} />
                </RibbonGroup>
            </RibbonPanel>
        );
    }
}

const mapStateToProps = (state: IEITAppStore) => ({
    userInfo: state.eit.userInfo,
    loading: !state.map.webMapImported,
    isMapActive: state.eit.eitMap.isMapActive,
    mobile: state.application.mobile
})

export default connect<OwnProps, DispatchProps, ParentProps>(mapStateToProps, {activateMap})(AdServicesTab);