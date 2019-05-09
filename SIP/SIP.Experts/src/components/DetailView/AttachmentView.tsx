import * as React from 'react';
import { connect } from 'react-redux';
import { featureLayersAttachmentsAPI } from '../../core/actions/helpers';
import { IGraphic, IFeatureLayerInfo } from '../../core/interfaces/models';
import { IAttachmentResponse, IQueryAttachmentMappedResponse } from '../../core/interfaces/helpers/IFeatureLayersAPI';
import { nls } from '../nls';
import OverlayLoader from '../../core/components/Loading/OverlayLoading';
import { getLayerInfos } from '../../core/reducers/layerInfos';
import { eitAppConfig } from '../../eitAppConfig';
import { IEITAppStore, IUserInfo } from '../../interfaces/reducers/IEITAppStore';
import { nls as core_nls } from '../../core/components/nls';

export interface OwnProps {
    userInfo: IUserInfo;
}

interface Props extends OwnProps {
    features: Array<IGraphic>;
    layerInfo: IFeatureLayerInfo;
    fieldId: string | number;
}

interface State {
    loading: boolean;
    attachmentDomElement: JSX.Element;
}




class AttachmentView extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            loading: true,
            attachmentDomElement: <div></div>
        };
    }

    getAttachments(): Promise<IAttachmentResponse> {
        //let layerInfos = getLayerInfos();
        //let layerInfoForAttachments = this.props.layerInfo

        //let layerInfosUrl = this.props.layerInfo.url;

        //if (layerInfosUrl === eitAppConfig.layers.Register2ServiceUrl) {
        //    for (const url in layerInfos) {
        //        if (layerInfos.hasOwnProperty(url)) {
        //            if (url === eitAppConfig.layers.Register2ServiceAttachmentsUrl) {
        //                layerInfoForAttachments = layerInfos[url];
        //                break;
        //            }
        //        }
        //    }
        //}
        
        console.log(this.props.layerInfo);

        return featureLayersAttachmentsAPI.queryAttachments(this.props.layerInfo, this.props.features, this.props.fieldId);
    }

    showAttachments(): Promise<Array<IQueryAttachmentMappedResponse>> {
        return new Promise((resolve, reject) => {
            this.getAttachments().then(res => {
                let featureAttachmentInfo = res.featureAttachmentActions;
                this.setState({ loading: false });
                resolve(featureAttachmentInfo);
            }).catch(err => {
                console.error(err);
                this.setState({ loading: false });
                resolve([]);
            })
        })
    }


    attachmentsDomConstruct(): Promise<JSX.Element> {
        let domElement: JSX.Element = <div></div>;
        return new Promise((resolve) => {
            this.showAttachments().then(res => {
                let attachmentsObjects: Array<{ name: string, url: string }> = [];
                res.forEach(feature => {
                    let featureId = Object.keys(feature)[0];
                    let attachmentsInfo = feature[featureId];
                    attachmentsInfo.forEach(attachment => {
                        let serviceUrl = this.props.layerInfo.url; //== eitAppConfig.layers.Register2ProtectedAttachmentsUrl ? eitAppConfig.layers.Register2ServiceAttachmentsUrl : this.props.layerInfo.url;
                        let featureUrl = `${serviceUrl}/${this.props.features[0].attributes[this.props.fieldId]}`;
                        let attachmentUrl = `${featureUrl}/attachments/${attachment.id}`;
                        if (this.props.userInfo && this.props.userInfo.token) {
                            attachmentUrl += "?token=" + this.props.userInfo.token; 
                        }
                        let attachmentObject = {
                            name: attachment.name,
                            url: attachmentUrl
                        }
                        attachmentsObjects.push(attachmentObject);
                    })
                })
                if (attachmentsObjects.length) {
                    domElement = <table style={{ width: "100%" }}>
                        <tbody>
                            <tr>
                                <th style={{ textAlign: "center" }}>{nls.nls.details.attachmetTitle}</th>
                            </tr>
                            <tr>
                                <td>
                                    {attachmentsObjects.reverse().map((attObj, i) => {
                                        return (<a key={i + "_att"} href={attObj.url} target="_blank">{attObj.name}<br></br></a>);
                                    })}
                                </td>
                            </tr>
                        </tbody>
                    </table>;
                    // resolve(domElement);
                    this.setState({ loading: false, attachmentDomElement: domElement })
                } 
                else {
                    domElement = <div>{core_nls.nls.details.noData}</div>
                    this.setState({ loading: false, attachmentDomElement: domElement })
                }
            }).catch(err => {
                console.error(err);
                domElement = <div>{nls.nls.details.noData}</div>
                this.setState({ loading: false, attachmentDomElement: domElement })
                // resolve(domElement);
            });
        });
    }


    loading(): JSX.Element {
        this.attachmentsDomConstruct();
        return (
            <OverlayLoader size="40px" show={true} />
        )
    }

    render() {
        return (
            this.state.loading ? this.loading() : this.state.attachmentDomElement
        );
    }
}

export const mapStateToProps = (state: IEITAppStore) => ({
    userInfo: state.eit.userInfo
})

export default connect<OwnProps>(mapStateToProps, {})(AttachmentView)