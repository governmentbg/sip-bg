import * as React from "react";
import { connect } from 'react-redux';
import axios from "axios";
import { mosaicLayoutDispatcher } from "../../core/actions/dispatchers";
import { IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import { IEITAppStore, IUserInfo } from "../../interfaces/reducers/IEITAppStore";
import EITAppWindow from '../../enums/EITAppWindow';
import OverlayLoader from "../../core/components/Loading/OverlayLoading";
import { toggleWindow } from "../../actions/helpers/toggleWindowHelper";
import { nls } from "../nls";

interface InternalState {
    loading: boolean;
    confirmationText: string;
}

interface ParentProps {
    serviceNr: number;
    vectorDataSelected : boolean;
    pdfUrl: string;
    isVectorSelected: boolean;
    shapeUrl: string;
    incoming_number: string;
}

interface OwnProps {
    loading: boolean;
    userInfo: IUserInfo;
}

interface DispatchProps {
}

type Props = DispatchProps & OwnProps & ParentProps;

class ServiceResultPane extends React.Component<Props, InternalState> {
    constructor(props: Props) {
        super(props);
        this.state = {
            loading: false,
            confirmationText: "",
        };
    }
    componentWillMount() {
    }
    componentDidMount() {
        this.setState({
            confirmationText: this.getConfirmationText(),
        });
        //this.mockLoading();
    }
    mockLoading = (): void => {
        try {
            this.setState({
                loading: true
            })
            setTimeout(() => {
                this.setState({
                    loading: false,
                    confirmationText: this.getConfirmationText(),
                });
            }, 500);
        }
        catch (e) {
            this.setState({
                loading: false
            });
        }
    }

    getConfirmationText = (): string => {
        let title: string = "";
        if (nls.nls.serviceWizard.confirmationByService.hasOwnProperty(this.props.serviceNr)) {
            title = nls.nls.serviceWizard.confirmationByService[this.props.serviceNr]
        }
        title = title.replace(new RegExp("{number}"), this.props.incoming_number); //  this.getRandomNumber()
        return title;
    }
    getRandomNumber = (): string => {
        return Math.floor((Math.random() * 1000) + 100).toString();
    }

    render() {
        let name:string = '';
        switch (this.props.serviceNr) {
            case 1:
                name = "EIT_TechnicalInfrastructure";
                break;
            case 2:
                name = "EIT_ElectronicCommunicationNetwork";
                break;
        }
        return (
            <div className="vertical-flex-container"
                style={{ height: "100%" }}>
                <OverlayLoader size="60px" show={this.state.loading} />
                <div className="flex-item flex-auto">
                    {
                        this.state.confirmationText.split('\n').map((text:string, i: number) => {
                            return (<p style={{pointerEvents:"auto", userSelect:"text"}}
                                        key={i}>
                                        {text}
                                    </p>);
                        })
                    }
                </div>
                {name ?
                    <React.Fragment>
                    {/* <p><a href={'public/eit/Services/SampleData/' + name + '.pdf'} target="_blank">Резултат (Изображение).pdf</a></p> */}
                    <p><a href= {this.props.pdfUrl} target="_blank">Резултат (Изображение).pdf</a></p>
                    {this.props.vectorDataSelected ?
                        <p><a href={this.props.shapeUrl} target="_blank">Резултат (Векторни данни).zip</a></p>
                        //<p><a href={'public/eit/Services/SampleData/' + name + '.zip'} target="_blank">Резултат (Векторни данни).zip</a></p>
                        : null
                    }
                    {/* <img src={'public/eit/Services/SampleData/' + name + '.png'} width="100%" style={{objectFit: "scale-down", flexShrink: 0}} /> */}
                    </React.Fragment>
                    : null
            }
            </div>
        )
    }
}

const mapStateToProps = (state: IEITAppStore) => ({
    loading: !state.map.webMapImported,
    userInfo: state.eit.userInfo,
})

export default connect<OwnProps, any, any>(mapStateToProps, {})(ServiceResultPane);
