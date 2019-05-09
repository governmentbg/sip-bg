import * as React from 'react';
import { nls } from "../nls";
import { connect } from 'react-redux';
import { IEITAppStore } from '../../interfaces/reducers/IEITAppStore';
import { IMapAction } from '../../interfaces/dispatchers/IMapActions';
import { activateMap } from '../../actions/dispatchers/eitMapDispatcher';
import { popupDispatcher } from "../../core/actions/dispatchers";
import { IPopupDispatcher } from "../../core/interfaces/dispatchers";
import AboutPopup from "../Popups/AboutPopup";

interface OwnProps {
    isMapActive: boolean;
}

interface DispatchProps extends IMapAction, IPopupDispatcher { }

interface ParentProps {
    additionalData?: string;
}

type Props = DispatchProps & ParentProps & OwnProps;

interface State { }

class About extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
    }

    componentWillMount() {
        if (!this.props.isMapActive) {
            this.props.activateMap(true);
        }
    }

    popupAbout = () => {
        this.props.addPopups({
            "about": {
                width: "700px",
                content: () => <AboutPopup />,
                header: () => <div></div>,
                closeButton: () => <span>X</span>
            }
        })
    }

    render() {
        return (
            <div className="ribbon-panel" style={{ backgroundColor: "white", alignItems: "center" }}>
                <div style={{ top: "30%", position: "absolute" }}>
                    <img src={'public/eit/About/' + nls.nls.logo_du} style={{ maxHeight: "60px", marginLeft: 10, }} 
                        onClick={this.popupAbout} />
                </div>
                <div style={{ top: "30%", position: "absolute", marginLeft: "35%" }}>
                    <img src={'public/eit/About/' + nls.nls.logo_es} style={{ maxHeight: "60px", marginLeft: 5, }}
                        onClick={this.popupAbout} />
                </div>
                <div style={{ top: "30%", position: "absolute", marginLeft: "70%" }}>
                    <img src={'public/eit/About/' + nls.nls.logo} style={{ maxHeight: "60px", marginLeft: 5, }} 
                        onClick={this.popupAbout} />
                </div>
                <div style={{ fontSize: 11, marginLeft: 10, position: "absolute", bottom: 0, lineHeight: 1.2 }}>
                    <span style={{ fontSize: 11, maxWidth: "80%", textAlign: "center", float: "left" }}
                        onClick={this.popupAbout} >
                        {nls.nls.about.forTheSystem}</span>
                    {/* <span dangerouslySetInnerHTML={{ __html: this.props.additionalHTML || '' }} /> */}
                    {/* <span style={{ marginRight: 10, marginTop: 'auto' }}>{this.props.additionalData}</span> */}
                    <span style={{ marginRight: 10, float: "right", bottom: 0, position: "absolute", right: 0 }}>{nls.nls.about.questionsAddress}</span>
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state: IEITAppStore) => ({
    isMapActive: state.eit.eitMap.isMapActive
})

export default connect<OwnProps, DispatchProps, ParentProps>(mapStateToProps, { activateMap, ...popupDispatcher })(About);