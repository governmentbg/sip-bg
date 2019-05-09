import * as React from "react";
import { connect } from 'react-redux';
import axios from "axios";
import { mosaicLayoutDispatcher } from "../../core/actions/dispatchers";
import { IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import { IEITAppStore, IUserInfo } from "../../interfaces/reducers/IEITAppStore";
import { eitAppConfig } from '../../eitAppConfig';
import EITAppWindow from '../../enums/EITAppWindow';
import OverlayLoader from "../../core/components/Loading/OverlayLoading";
import { toggleWindow } from "../../actions/helpers/toggleWindowHelper";
//import { TableProps, Column, FinalState } from "react-table";
//import ReactTable from "react-table";
import { nls } from "../nls";
import { element } from 'prop-types';

interface InternalState {
    loading: boolean;
    introHTMLContent: string;
    iisdaContent: any;
}

interface ParentProps {
    serviceNr?: number;
    title: string;
    introUrl: string;
    window: EITAppWindow,
}

interface OwnProps {
    loading: boolean;
}

interface DispatchProps extends IMosaicLayoutDispatcher {
}

type Props = DispatchProps & OwnProps & ParentProps;

class ServiceInfoPane extends React.Component<Props, InternalState> {
    constructor(props: Props) {
        super(props);
        this.state = {
            loading: false,
            introHTMLContent: '',
            iisdaContent: {},
        };
    }

    fetchText = (url: string): void => {
        try {
            (axios.get(url)).then((response: any) => {
                this.setState({
                    introHTMLContent: response.data,
                });
            }).catch((error: Error) => { console.error(error); });
        }
        catch (e) {
            console.error(e);
        }
    }

    fetchIISDAContent = (url: string): void => {
        try {
            let iisdaServiceNumber: number | undefined = eitAppConfig.IISDAServiceNumbers['Service' + (this.props.serviceNr ? this.props.serviceNr.toString() : '')];
            if (!iisdaServiceNumber) {
                return;
            }
            axios.get(url, { params: { serviceNumber: iisdaServiceNumber } }).then((response: any) => {
                console.log(response.data);
                if (response.data.length > 0) {
                    this.setState({
                        iisdaContent: response.data[0],
                    });
                }
            }).catch((error: Error) => {
                console.error(error);
            });
        }
        catch (e) {
            console.error(e);
        }
    }

    componentDidMount() {
        this.fetchText(this.props.introUrl);
        this.fetchIISDAContent(eitAppConfig.IISDAServiceMainDataUrl);
    }

    onApplyClick = (event: React.MouseEvent<HTMLElement>): void => {
        toggleWindow(this.props, this.props.window);
    }

    removeTags = (title?: string): string => {
        return (title || '').replace(new RegExp('<br/>', 'g'), "");
    }

    //getIISDATableColumns = (): Column[] =>{
    //    return [{ Header : '', accessor: 'key' }, { Header : '', accessor: 'value' }]
    //}

    getIISDATableData = (): Array<any> =>{
        if (!this.state.iisdaContent.ServiceNumber){
            return [];
        }
        let legalBasisDescription: string = '';
        if (this.state.iisdaContent.LegalBasis){
            this.state.iisdaContent.LegalBasis.forEach((lbElement: any) =>{
                if (legalBasisDescription){
                    legalBasisDescription += '\n';
                }
                legalBasisDescription += lbElement.RegulatoryActName || '';
                if (lbElement.StructuredData){
                    lbElement.StructuredData.reverse().forEach((element: any) => {
                        if (legalBasisDescription){
                            legalBasisDescription += '\n';
                        }
                        // във връзка с
                        if (element.Text) {
                            legalBasisDescription += element.Text + ' ';
                        }
                        // член, параграф, алинея, буква и точка 
                        if (element.Article) {
                            legalBasisDescription += ' ' + nls.nls.serviceWizard.serviceIISDALegalElement.Article + element.Article;
                        }
                        if (element.Paragraph) {
                            legalBasisDescription += ' ' + nls.nls.serviceWizard.serviceIISDALegalElement.Paragraph + ' ' + element.Paragraph;
                        }
                        if (element.SubParagraph) {
                            legalBasisDescription += ' ' + nls.nls.serviceWizard.serviceIISDALegalElement.SubParagraph + ' ' + element.SubParagraph;
                        }
                        if (element.Letter) {
                            legalBasisDescription += ' ' + nls.nls.serviceWizard.serviceIISDALegalElement.Letter + ' ' + element.Letter;
                        }
                        if (element.Point) {
                            legalBasisDescription += ' ' + nls.nls.serviceWizard.serviceIISDALegalElement.Point + ' ' + element.Point;
                        }
                    });
                }
            });
        }
        console.log(legalBasisDescription);
        let items: Array<any> = [
            {
                key: nls.nls.serviceWizard.serviceIISDAInfoLabels['BatchID'] || 'BatchID',
                value: this.state.iisdaContent.BatchID
            },
            {
                key: nls.nls.serviceWizard.serviceIISDAInfoLabels['ServiceNumber'] || 'ServiceNumber',
                value: this.state.iisdaContent.ServiceNumber
            },
            {
                key: nls.nls.serviceWizard.serviceIISDAInfoLabels['Name'] || 'Name',
                value: this.state.iisdaContent.Name
            },
            {
                key: nls.nls.serviceWizard.serviceIISDAInfoLabels['LegalBasis'] || 'LegalBasis',
                value: legalBasisDescription
            },
            {
                key: nls.nls.serviceWizard.serviceIISDAInfoLabels['IsFromEU'] || 'IsFromEU',
                value: nls.nls.serviceWizard.serviceIISDABooleanChoice[this.state.iisdaContent.IsFromEU]
            },
            {
                key: nls.nls.serviceWizard.serviceIISDAInfoLabels['SectionName'] || 'SectionName',
                value: this.state.iisdaContent.SectionName
            },
            {
                key: nls.nls.serviceWizard.serviceIISDAInfoLabels['Description'] || 'Description',
                value: this.state.iisdaContent.Description
            },
            {
                key: nls.nls.serviceWizard.serviceIISDAInfoLabels['IsInternalAdminService'] || 'IsInternalAdminService',
                value: nls.nls.serviceWizard.serviceIISDABooleanChoice[this.state.iisdaContent.IsInternalAdminService]
            },
            {
                key: nls.nls.serviceWizard.serviceIISDAInfoLabels['IsRegime'] || 'IsRegime',
                value: nls.nls.serviceWizard.serviceIISDAIsRegimeChoice[this.state.iisdaContent.IsRegime]
            },
            {
                key: nls.nls.serviceWizard.serviceIISDAInfoLabels['RegimeName'] || 'RegimeName',
                value: this.state.iisdaContent.RegimeName
            },
            {
                key: nls.nls.serviceWizard.serviceIISDAInfoLabels['BusinessActivityName'] || 'BusinessActivityName',
                value: this.state.iisdaContent.BusinessActivityName
            },
        ];
        if (!this.state.iisdaContent.IsRegime) {
            items.splice(9, 1);
        }
        if (!this.state.iisdaContent.BatchIDSpecified) {
            items.splice(0, 1);
        }
        else {
            // Always remove BatchID
            items.splice(0, 1);
        }
        // Always remove ServiceNumber
        items.splice(0, 1);
        return items;
    }

    renderIISDATable = (): JSX.Element =>{
        return (<table className="iisdainfo">
                    <tbody>
                    {
                        this.getIISDATableData().map((item: any, i:number) =>
                            (<tr key={i}>
                                <td className="iisdalabel"><p>{item.key}</p></td>
                                <td className="iisdainfo"><p style={{whiteSpace: "pre-line"}}>{item.value}</p></td>
                            </tr>))
                    }
                    </tbody>
                </table>);
    }

    render() {
        /*
        const iisdaTableData: Array<any> = this.getIISDATableData();
        const iisdaTableProps: Partial<TableProps> = {
            columns: this.getIISDATableColumns(), 
            data: iisdaTableData,
            pageSize: iisdaTableData.length,
            showPagination:false,
            showFilters: false,
        };
        */
        return (
            <div className="vertical-flex-container"
                style={{ height: "100%" }}>
                <OverlayLoader size="60px" show={this.state.loading} />
                <div className="flex-item flex-auto vertical-flex-container"
                    style={{ paddingBottom: "10px", paddingTop: "10px" }}>
                    <span style={{ fontSize: "125%", textIndent: "1em", marginTop: "2px", marginBottom: "2px" }}>{nls.nls.serviceWizard.serviceInfoTitle}</span>
                </div>
                <div style={{ overflow: "auto", scrollBehavior: "smooth", overflowX: "hidden" }}
                    className="flex-item flex-scalable">
                    { this.state.iisdaContent.ServiceNumber?
                        <p className="flex-item flex-auto">{nls.nls.serviceWizard.serviceIISDAInfoTitle}</p>
                        : null
                    }
                    {
                        this.renderIISDATable()
                    }
                    {/* <ReactTable { ...iisdaTableProps} ></ReactTable> */}
                    <p className="flex-item flex-auto">{nls.nls.serviceWizard.serviceSIPInfoTitle}</p>
                    <div className="flex-item flex-auto" dangerouslySetInnerHTML={{ __html: this.state.introHTMLContent }} />
                </div>
                <div className="flex-item flex-auto horizontal-wrapping-flex-container"
                    style={{ paddingBottom: "10px", paddingTop: "10px" }}>
                    <button className="appBtn"
                        onClick={this.onApplyClick}
                        style={{ height: "30px", flexGrow: 0, flexBasis: "150px", marginBottom: "10px" }}>
                        <img src="public/eit/Services/enter32.png" style={{ width: "20px", height: "20px" }} />
                        <span>&nbsp;{nls.nls.serviceWizard.apply}</span>
                    </button>
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state: IEITAppStore) => ({
    loading: !state.map.webMapImported,
})

export default connect<OwnProps, IMosaicLayoutDispatcher, any>(mapStateToProps, { ...mosaicLayoutDispatcher })(ServiceInfoPane);
