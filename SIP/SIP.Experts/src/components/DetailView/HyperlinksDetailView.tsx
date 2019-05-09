import * as React from 'react';
import { eitAppConfig } from '../../eitAppConfig';
import { getLayerInfos } from "../../core/reducers/layerInfos";
import { featureLayersAPI } from "../../core/actions/esri/helpers/featureLayersAPI";
import { IFeatureLayerInfo, IGraphic } from '../../core/interfaces/models';
import OverlayLoader from "../../core/components/Loading/OverlayLoading";
import Collapsible from '../../core/components/Widgets/Collapsible/Collapsible';
import { nls } from "../nls";
import { isNullOrUndefined } from 'util';

export interface ParentProps {
    organization?: IGraphic;
}
interface OwnProps {
}

interface DispatchProps {
}

type Props = OwnProps & DispatchProps & ParentProps;

export interface State {
    loaded: boolean;
    loading: boolean;
    hyperlinksHidden?: boolean;
    hyperlinks?: Array<IGraphic>;
}

export default class HyperlinksDetailView extends React.Component<Props, State> {
    hyperlinksLayerInfo:IFeatureLayerInfo;

    constructor(props: Props) {
        super(props);
        this.hyperlinksLayerInfo = getLayerInfos()[eitAppConfig.layers.RegistersOrganizationsHyperlinks];
        this.state = {
            loaded: false,
            loading: false,
            hyperlinksHidden: true,
            hyperlinks: [],
        };
    }

    componentDidMount() {
        this.loadHyperlinks(this.props.organization);
    }

    loadHyperlinks = (organization?: IGraphic): void => {
        if (!this.state.loaded && organization) {
            this.setState({
                loading: true,
            });
            featureLayersAPI.execute(this.hyperlinksLayerInfo, {
                where: `organizationid = '${organization.attributes["id"]}'`,
                outFields: ["*"],
                orderByFields: ['name ASC'],
            }).then(hyperlinks => {
                    this.setState({
                        loaded: true,
                        loading: false,
                        hyperlinks: hyperlinks,
                    })
                }).catch(e => {
                    this.setState({
                        loaded: true,
                    })
                });
        }
        else {
            this.setState({
                loaded: true,
            });
        }
    }

    renderHyperlinks = (): JSX.Element => {
        console.warn(this.state.hyperlinks);
        let hyperlinks: Array<JSX.Element> = [];
        this.hyperlinksLayerInfo.popupInfo.fieldInfos["hyperlinktype"].domain!.codedValues.forEach((hyperlinkType, j) => {
            let typeHyperlinks: Array<JSX.Element> = [];
            if (this.state.hyperlinks) {
                for (let i = 0; i < this.state.hyperlinks.length; i++) {
                    if (this.state.hyperlinks[i].attributes["hyperlinktype"] == hyperlinkType.code) {
                        typeHyperlinks.push(<div key={i}>{this.getHyperlinkLine(this.state.hyperlinks[i])}</div>)
                    }
                }
            }
            hyperlinks.push(<div key={j} className="hyperlinkTypeContainer">
                <div style={{ textAlign: "center", fontSize: "110%", fontWeight:700 }}><b>{hyperlinkType.name}</b></div>
                {typeHyperlinks}
            </div>)
        })

        return <div>{hyperlinks}</div>
    }
    
    getHyperlinkLine = (hyperlink: IGraphic): JSX.Element => {
        return  <div className="hyperlinkContainer">
                    <p>{hyperlink.attributes["description"]} {!isNullOrUndefined(hyperlink.attributes.hyperlinkurl) ? <a target="_blank" href={hyperlink.attributes.hyperlinkurl.toString()}>{hyperlink.attributes["name"]}</a> : (null)}</p>
                </div>
    }
    triggerOpenCollapsible = (contentId: string) => {
        if (contentId == "hyperlinks") {
            this.setState({ ...this.state, hyperlinksHidden: !this.state.hyperlinksHidden })
        }
    }
    render() {
        return <Collapsible
            mobile={true}
            contentId={"hyperlinks"}
            toggleOpen={this.triggerOpenCollapsible}
            triggerComponent=
            {(<div className="tableHeader tableHeaderColor1">
                <span className="tableCollapeTitle">{nls.nls.detailView.hyperlinksData}</span>
                <span style={{ marginLeft: "auto", transform: "rotate(90deg)", fontSize: "25px" }}>{!this.state.hyperlinksHidden ? "«" :  "»"}</span>
            </div>)}
            open={(!this.state.hyperlinksHidden ? true : false)}
            height={"auto"}
            triggerHeight={"40px"}
            contentStyle={{ backgroundColor: "#817e7e" }}>
            <div>
                <OverlayLoader size="60px" show={this.state.loading} />
                {
                    this.renderHyperlinks()
                }
            </div>
            </Collapsible>
    }
}
