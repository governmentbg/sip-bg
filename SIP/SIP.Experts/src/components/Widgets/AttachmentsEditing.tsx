import * as React from 'react';
import { nls } from "../nls";
import * as classNames from 'classnames';
import { isNullOrUndefined } from 'util';

export interface AttachmentInfo {
    name: string;
    size: number;
    type: string;
    file?: File;
    url: string;
}
export interface ParentProps {
    attachments?: AttachmentInfo[];
    maxNumber?: number;
    label?: string;
    isRequired?: boolean;
    requiredMsg?: string;
    acceptTypes?: string;
    isDisabled?: boolean;
    onAttachmentsChange?: (attachments: AttachmentInfo[]) => void;
}
interface OwnProps {
}
interface DispatchProps {
}

type Props = OwnProps & DispatchProps & ParentProps;

export interface State {
    attachments: AttachmentInfo[];
    value?: any;
}

export default class AttachmentsEditing extends React.Component<Props, State> {
    fileInput: React.RefObject<HTMLInputElement>;
    constructor(props: Props) {
        super(props);
        this.state = {
            attachments: [],
            value: '',
        };
        this.fileInput = React.createRef();
    }

    componentDidMount() {
    }

    componentWillReceiveProps(props:ParentProps){
        this.setState({
            attachments : props.attachments || [],
        });
        if (this.fileInput && this.fileInput.current && (props.attachments || []).length == 0)
        {
            this.setState({
                value: '',
            });
        }
    }

    onAddAttachmentClick = (event: React.MouseEvent<HTMLElement>):void => {
        if (this.fileInput && this.fileInput.current) {
            this.fileInput.current.click();
        }
    }

    onRemoveAttachmentClick = (index: number):void => {
        let newAttachments: AttachmentInfo[] = this.state.attachments.slice();
        newAttachments.splice(index, 1);
        this.setState ({
            attachments: newAttachments,
        });
        if (this.props.onAttachmentsChange) {
            this.props.onAttachmentsChange(newAttachments);
        }
    }

    onAttachmentsChange = (event: React.ChangeEvent<HTMLInputElement>):void => {
        if (event.target.files && event.target.files.length > 0){
            let newFile:File = event.target.files[0];
            let newName: string = newFile.name;
            //if (newName.length > 50) {
            //    let ext: string = newName.split('.').reverse()[0];
            //    newName = newName.substr(0, 48 - ext.length) + "." + ext;
            //}
            // TODO: Handle long file names, extra large files, etc. 
            if (!this.state.attachments.slice().some((attachment, i, attachments) => this.compareFiles(attachment.file, newFile))) {
                let newAttachments: AttachmentInfo[] = this.state.attachments.slice();
                newAttachments.push({name: newName || '', type: newFile.type || '', size: newFile.size, file: newFile, url: ''});
                this.setState ({
                    attachments: newAttachments,
                    value: event.target.value,
                });
                if (this.props.onAttachmentsChange) {
                    this.props.onAttachmentsChange(newAttachments);
                }
            }
        }
    }

    compareFiles = (file1?: File, file2?:File) : boolean =>{
        return !isNullOrUndefined(file1) && 
            !isNullOrUndefined(file2) &&
            file1.name == file2.name &&
            file1.type == file2.type &&
            file1.size == file2.size &&
            file1.lastModified == file2.lastModified;
    }

    formatDouble = (value: number, fractionDigits: number): string => {
        return value.toLocaleString('en', { useGrouping: true, minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).replace(/,/g, ' ').replace('.', ',');
    }

    formatBytes = (value: number): string => {
        if (value < 1042) {
            return this.formatDouble(value, 0) + ' b';
        }
        else if (value < 1042 * 1024) {
            return this.formatDouble(value / 1024, 2) + ' Kb (' + this.formatDouble(value, 0) + ' b)';
        }
        else {
            return this.formatDouble(value / (1042 * 1024), 2) + ' Mb (' + this.formatDouble(value, 0) + ' b)';
        }
    }

    render() {
        const valid: boolean = !this.props.isRequired || this.state.attachments.length > 0;
        const labelClasses: string = classNames('attachmentLabel', {'al-valid': valid}, {'al-invalid': !valid});
        return <div className="flex-auto vertical-flex-container" style={{ width: "100%" }}>
            {
                this.props.label ?
                    <p className={labelClasses}>{this.props.label}{valid ? '' : this.props.requiredMsg}</p>
                    : null
            }
            {
                this.state.attachments.map((attachment: AttachmentInfo, index: number) =>
                    <div className="flex-item flex-auto horizontal-wrapping-flex-container"
                        key={index}
                        style={{ width: "100%" }}>
                        <div className="flex-item flex-scalable" style={{ flexGrow: 1.5, flexShrink: 1, overflowX: "hidden", overflowY: "hidden" }}>
                            {
                                (attachment.url) ?
                                    <a href={attachment.url} target="_blank" type={attachment.type}><span>{attachment.name}</span></a>
                                    :
                                    <span>{attachment.name}</span>
                            }
                        </div>
                        <div className="flex-item flex-scalable">
                            <span>{this.formatBytes(attachment.size)}</span>
                        </div>
                        {
                            this.props.isDisabled ?
                            null:
                            <div className="flex-item flex-auto horizontal-wrapping-flex-container">
                                <button className="appBtn"
                                    key={index}
                                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => this.onRemoveAttachmentClick(index)}
                                    style={{ maxWidth: "32px" }}
                                    title={nls.nls.attachmentsEditing.remove}>
                                    <img src='public/eit/Feedback/RemoveAttachment32.png' style={{ width: "20px", height: "20px" }} />
                                </button>
                            </div>
                        }
                    </div>
                )
            }
            {
                (!this.props.isDisabled && this.props.maxNumber && this.state.attachments.length < this.props.maxNumber) ? 
                    <div className="flex-item flex-auto horizontal-wrapping-flex-container" style={{ width: "100%" }}>
                        <div className="flex-item flex-auto horizontal-wrapping-flex-container">
                            <button className="appBtn"
                                    onClick={this.onAddAttachmentClick} 
                                    style={{ maxWidth: "32px" }}
                                    title={nls.nls.attachmentsEditing.add}>
                                <img src='public/eit/Feedback/AddAttachment32.png' style={{ width: "20px", height: "20px" }} />
                                <input ref={this.fileInput} 
                                    /*value={this.state.value}*/
                                    type='file'
                                    accept={this.props.acceptTypes}
                                    onChange={this.onAttachmentsChange} style={{ display: "none", visibility: "hidden" }} />
                            </button>
                        </div>
                        <div className="flex-item flex-scalable">
                            <span> </span>
                        </div>
                    </div>
                    :null
            }
        </div>
    }
}
