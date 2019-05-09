import * as React from 'react';
import DetailView, { Props } from '../../core/components/DetailView/DetailView';
import AttachmentView from './AttachmentView';
import { eitAppConfig } from '../../eitAppConfig';
import HyperlinksDetailView from './HyperlinksDetailView';
import { getLayerInfos } from "../../core/reducers/layerInfos";
import { IFeatureLayerInfo } from '../../core/interfaces/models';
import { Brand } from 'react-bootstrap/lib/Navbar';

interface State {
}

export default class EitDetailView extends DetailView<State> {
    constructor(props: Props){
        super(props);
        this.state= {
            loaded: true,
            maxHeight: "0px",
        }
    }

    hasAttachments(layerInfo: IFeatureLayerInfo|undefined): boolean {
        if (layerInfo && layerInfo.hasAttachments) {
            return true;
        }
        return false;
    }

    getExpectedUrl = (): IFeatureLayerInfo|undefined => {
        let attachmentsUrl:IFeatureLayerInfo|undefined = undefined;
        if (this.props.layerInfo.url == eitAppConfig.layers.Register2ProtectedServiceUrl){
            attachmentsUrl = getLayerInfos()[eitAppConfig.layers.Register2ServiceAttachmentsUrl];
        } else if (this.props.layerInfo.url == eitAppConfig.layers.MergedServiceRegister) {
            const serviceId = this.props.graphic.attributes["service_id"];
            
            switch (serviceId) {
                case 52:
                attachmentsUrl = getLayerInfos()[eitAppConfig.layers.ServiceRegisters52];
                    break;
                case 53:
                attachmentsUrl = getLayerInfos()[eitAppConfig.layers.ServiceRegisters53];
                    break;
                default:
                    break;
            }
        }

        return attachmentsUrl;
    }

    getFieldId = (): string => {
        let fieldId: string = "";
        if (this.props.layerInfo.url === eitAppConfig.layers.Register2ProtectedServiceUrl) {
            fieldId = "objectid";
        } else if (this.props.layerInfo.url === eitAppConfig.layers.MergedServiceRegister) {
            fieldId = "service_objectid";
        }

        return fieldId;
    }

    render() {
        //let register2AuxillaryLayerInfo:IFeatureLayerInfo|undefined = undefined;
        let attachmentsUrl:IFeatureLayerInfo|undefined = this.getExpectedUrl();
        const fieldId = this.getFieldId();
        let fields = this.renderFeatures(this.props.graphic, this.props.layerInfo);
        return  <div className="detail-view" style={{ maxHeight: "fit-content" }}>
                {
                    this.props.layerInfo.url == eitAppConfig.layers.RegistersOrganizations ?
                        <HyperlinksDetailView organization={this.props.graphic} />
                        : null
                }
                {this.renderFields(fields)} 
                {this.hasAttachments(attachmentsUrl) || (this.props.layerInfo.url === eitAppConfig.layers.Register2ProtectedServiceUrl) || (this.props.layerInfo.url === eitAppConfig.layers.MergedServiceRegister) ? 
                <AttachmentView features={[this.props.graphic]} layerInfo={attachmentsUrl!} fieldId={fieldId} /> : null}
                </div>
    }
}