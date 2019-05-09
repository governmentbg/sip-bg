import * as React from 'react';
import * as classNames from 'classnames';
import { connect } from 'react-redux';
import * as Datetime from "react-datetime";
import { isNullOrUndefined } from 'util';
import { eitAppConfig } from '../../eitAppConfig';
import Autocomplete, { QueryType, AutocompleteObject } from "../../core/components/Widgets/Autocomplete";
import { Moment } from 'moment';
import { nls } from "../nls";

export type DateInputValueType = string | Date | Moment | undefined;
export type InputValueType = string | string[] | number | boolean | undefined | DateInputValueType;

const padStart = (val: number, times: number, char:string = "0") => {
    return (new Array<string>(times).join(char.substr(0, 1)) + val.toString()).slice(-times);
}

export const formatDate = (date: DateInputValueType | number, longFormat: boolean = false): string | undefined => {
    //console.log(typeof date);
    if (!date) return '';
    if (typeof date === 'string') {
        return date as string;
    }
    else if ((date as any).getDate) {
		let theDate: Date = (date as Date);
		if (longFormat){
			return `${padStart(theDate.getDate(), 2)}.${padStart(theDate.getMonth() + 1, 2)}.${theDate.getFullYear()} ${padStart(theDate.getHours(), 2)}:${padStart(theDate.getMinutes(), 2)}`;
		}
		else{
			return `${padStart(theDate.getDate(), 2)}.${padStart(theDate.getMonth() + 1, 2)}.${theDate.getFullYear()}`;
		}
	}
    else if ((date as Moment).utc) {
		if (longFormat){
			return (date as Moment).format('DD.MM.YYYY HH:mm');
		}
		else {
			return (date as Moment).format('DD.MM.YYYY');
		}
	}
	else if (typeof date === 'number') {
        return formatDate(new Date(date as number), longFormat);
	}
	return undefined;
}


interface ISelectorItems {
	[key: string]: string,
}
interface ISelectorItem {
	key: string,
	value: string,
}

interface ParentProps {
	type?: string;
	id?: string;
	value?: InputValueType;
	hasError?: boolean;
	className?: string;
	placeholder?: string;
	errorMsg?: string;
	requiredMsg?: string;
	pattern?: RegExp;
	isMultiline?: boolean;
	isRequired?: boolean;
	isDisabled?: boolean;
	autoComplete?: boolean;
	maxLength?: number,
	minWidth?: string,
	style?: any,
	onValueChange?: (newValue: InputValueType, hasError: boolean) => void;
	selectorItems?: ISelectorItems;
	onKeyUp?: ((event: React.KeyboardEvent<HTMLElement>) => void) | undefined;
    autoCompleteSearchLayerInfo?: any,
	onAutoCompleteSelection?: (args:any) => void,
	closeOnSelect?: boolean;
	minDate?: Date;
	maxDate?: Date;
	isDataReturnedAutocomplete?: (isReturnedData: boolean) => void;
}

interface DispatchProps {
}
interface InternalState {
    value: InputValueType;
    inputText: string | undefined;
	hasError: boolean;
	focused: boolean;
}
type Props = ParentProps & DispatchProps;

class FloatingLabelInput extends React.Component<Props, InternalState> {
	constructor(props: Props) {
		super(props);
		this.state = {
            value: props.value,
            inputText: props.value as string,
			hasError: false,
			focused: false,
		};
	};
    onFocus = (event: React.FocusEvent<HTMLElement>): void => {
        this.setState({
			...this.state,
			focused: true,
		});
        //if (this.props.type == 'date') {
        //    console.warn('onDateFocus');
        //}
	}
	onBlur = (event: React.FocusEvent<HTMLElement>): void => {
		var value: InputValueType = this.getElementValue(event.currentTarget);
		this.updateState(value, true);
	}
	onChange = (event: React.ChangeEvent<HTMLElement>): void => {
		var value: InputValueType = this.getElementValue(event.currentTarget);
		this.updateState(value, false);
    }
    onDateBlur = (event: string | Moment): void => {
	    var value: InputValueType = this.getDateValue(event);
		this.updateState(value, true);
		//console.warn('onDateBlur');
		//console.log(value);
	}
    onDateChange = (value: string | Moment): void => {
		this.updateState(this.getDateValue(value), false);
    }
    updateState = (currentValue: InputValueType, leavingFocus: boolean): void => {
        let newValue: InputValueType = !!this.props.autoComplete && !!this.props.isRequired ? this.props.value : currentValue;
        if (!!this.props.autoComplete && !leavingFocus && this.state.inputText != currentValue && !!this.props.isRequired) {
            newValue = '';
        }
        const newHasError: boolean = this.getHasError(newValue, this.props) || this.getNeedsValue(newValue, this.props) ||
            !!this.props.autoComplete && this.getNeedsValue(this.state.value, this.props);
        if (!!this.props.autoComplete) {
            this.setState({
                inputText: currentValue as string,
            });
		}
        this.setState({
            value: newValue,
		});
		if (leavingFocus){
			this.setState({
				hasError: newHasError,
                focused: false,
			});
		}
		if (this.props.onValueChange) {
            this.props.onValueChange(newValue, newHasError || this.getNeedsValue(newValue, this.props));
		}
    }
    getDateValue = (date: any): Date | string | undefined => {
        if (!date) return undefined;
        try {
            if (typeof date === 'string') {
                return date as string;
			}
			if (typeof date === 'number') {
                return new Date(date);
			}
			if ((date as Date).getDate) {
                return date as Date;
			}
            if ((date as Moment).utc) {
                return (date as Moment).toDate();
			}
			return '';
		}
		catch(e){
			console.error('getDateValue');
			console.error(e);
            return '';
		}
    }
    isValidDate = (currentDate: Moment, selectedDate: Moment): boolean => {
		let isValid = true;
        if (this.props.minDate) {
            isValid = isValid && currentDate.toDate() >= this.props.minDate;
		}
		if (this.props.maxDate) {
            isValid = isValid && currentDate.toDate() <= this.props.maxDate;
		}
        return isValid;
    }
	getElementValue = (target: HTMLElement): InputValueType => {
		if (this.props.type == 'date'){
			return this.getDateValue(target);
		}
		var value: InputValueType = undefined;
		if (target as HTMLInputElement) {
			value = (target as HTMLInputElement).value;
			if ((target as HTMLInputElement).type == 'checkbox') {
				value = (target as HTMLInputElement).checked;
			}
		}
		return value;
	}
    getHasValue = (currentValue: any) => {
		return !isNullOrUndefined(currentValue) ? ((currentValue == 0 && currentValue.toString() != 'false') ? false : currentValue.toString().trim().length > 0) : false;
	}
	getHasError = (currentValue: any, props: Props): boolean => {
		if (currentValue && !props.isDisabled && props.type == 'date' && typeof currentValue === 'string'){
			return true;
		}
		return currentValue ? (props.pattern ? !props.pattern.test(currentValue) : false) : false;
	}
	getNeedsValue = (currentValue: any, props: Props) => {
		return !!props.isRequired ? !this.getHasValue(currentValue) : false;
	}
	formatDate = (date: DateInputValueType): string | undefined =>{
		return formatDate(date);
	}
	componentWillReceiveProps(props: Props) {
		this.setState({
			value: props.value,
        });
		const reset = !isNullOrUndefined(props.hasError) && !props.hasError && props.hasError != this.state.hasError;
		if (this.props.value != this.state.value || reset) {
			this.setState({
				hasError: false,
				focused: false,
			});
		}
	}
	render() {
		const propType = this.props.type || 'text';
		const placeholder = this.props.placeholder || '';
        const id = this.props.id || this.props.placeholder;
        const normallyRequired: boolean = this.state.hasError && this.getNeedsValue(this.props.value, this.props);
        const autoCompleteRequired: boolean = !!this.props.autoComplete && !!this.props.isRequired && !this.getHasValue(this.props.value) && this.getHasValue(this.state.inputText);
        const readonlyRequired: boolean = !!this.props.isDisabled && !!this.props.isRequired && !this.getHasValue(this.props.value);
        const needsValue: boolean = normallyRequired || autoCompleteRequired || readonlyRequired;
        const hasValue: boolean = this.getHasValue(this.props.value) || (!!this.props.autoComplete && this.getHasValue(this.state.inputText));
		const hasError: boolean = this.getHasError(this.props.value, this.props);
		const containterClasses = classNames('fl-input-container', this.props.className,
			{ 'fl-nonempty': hasValue },
			{ 'fl-focused': this.state.focused },
			{ 'fl-valid': hasValue && !needsValue && !hasError },
			{ 'fl-invalid': needsValue || hasError });
		const labelClasses = classNames('fl-input-label',
			{ 'fl-nonempty': hasValue },
			{ 'fl-focused': this.state.focused },
			{ 'fl-valid': hasValue && !needsValue && !hasError },
			{ 'fl-invalid': needsValue || hasError });
		const inputClasses = classNames('fl-input',
			{ 'fl-nonempty': hasValue },
			{ 'fl-focused': this.state.focused },
			{ 'fl-valid': hasValue && !needsValue && !hasError },
			{ 'fl-invalid': needsValue || hasError });
		var label: string = placeholder;
		if (!this.state.focused && !hasValue && !hasError && !needsValue) {
			label = '<' + label + '>';
		}
		if (this.getNeedsValue(this.state.value, this.props) || hasError) {
			label = (label + ' ' + (this.props.requiredMsg || '')).trim();
		}
		if (this.state.hasError && hasError) {
			label = (label + ' ' + (this.props.errorMsg || '')).trim();
		}
		//console.log('label: ' + label + ' value: ' + this.state.value);

		let selectorItems: Array<ISelectorItem> = [];
		if (!isNullOrUndefined(this.props.selectorItems)) {
			let keys: string[] = Object.keys(this.props.selectorItems!);
			for (let i in keys) {
				let key: string = keys[i];
				let value: string = this.props.selectorItems![key];
				selectorItems.push({ key: key, value: value });
			}
			//selectorItems = Array.from<string, ISelectorItem>(keys, (v: string, i: number) : ISelectorItem => { return { key: v, value: this.props.selectorItems![v] }});
		}
		const minWidth = this.props.minWidth || "180px";
		return (
			<div className={containterClasses}
				style={{...this.props.style, minWidth: minWidth}}>
				<div style={{overflow: "hidden", overflowX: "hidden", overflowY: "hidden", textOverflow: "elipsis"}}>
					<label className={labelClasses}
						htmlFor={id} style={{
                            position: "absolute", zIndex: 99, width: "100%", whiteSpace: "nowrap",
                            pointerEvents: this.props.type == "checkbox" ? "auto" : "none", cursor: this.props.type == "checkbox" && !this.props.isDisabled ? "pointer" : "auto",
						}}>
						{label}
					</label>
				</div>
				<div style={{ paddingTop: "1em", height: "100%", width: "100%" }}>
                    {
                        (!!this.props.isMultiline) ?
                            this.props.isDisabled ?
                                <div className={inputClasses}
                                    style={{
                                        minWidth: "unset", width: "100%", height: "100%",
                                        backgroundColor: "rgb(235, 235, 228)",
                                        whiteSpace: "pre-wrap",
                                        paddingTop: "15px",
                                        overflowX: "hidden",
                                        overflowY: "auto",
                                        scrollBehaviour: "smooth",
                                    } as any}>
                                    <p style={{ paddingLeft: "3px", paddingRight: "3px" }}>
                                        {this.state.value}
                                    </p>
                                </div> :
                                <textarea style={{ minWidth: "unset", scrollBehavior: "auto", resize: "none", height: "100%", width: "100%", paddingTop: "15px" }}
                                    autoComplete={(!!this.props.autoComplete).toString()}
                                    className={inputClasses}
                                    disabled={this.props.isDisabled}
                                    id={id}
                                    onFocus={this.onFocus}
                                    onBlur={this.onBlur}
                                    onChange={this.onChange}
                                    maxLength={this.props.maxLength}
                                    value={this.state.value as string | number | undefined}
                                    onKeyUp={this.props.onKeyUp} />

                            :
                            !isNullOrUndefined(this.props.selectorItems) ?
                                <select style={{ minWidth: "unset", width: "100%" }}
                                    className={inputClasses}
                                    required={this.props.isRequired}
                                    disabled={this.props.isDisabled}
                                    id={id}
                                    onFocus={this.onFocus}
                                    onBlur={this.onBlur}
                                    onChange={this.onChange}
                                    value={this.state.value as string | number | undefined}>
                                    {
                                        selectorItems.map((selectorItem: ISelectorItem, i: number) =>
                                            <option key={selectorItem.key}
                                                value={selectorItem.key}
                                                className={inputClasses}
                                                style={{ minWidth: "unset", width: "100%" }}>
                                                {selectorItem.value}
                                            </option>
                                        )
                                    }
                                </select>
                                : propType == 'checkbox' ?
                                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", minWidth: "unset", width: "100%" }}>
                                        <input style={{ height: "14px", cursor: this.props.isDisabled ? "auto" : "pointer" }}
                                            required={this.props.isRequired}
                                            disabled={this.props.isDisabled}
                                            id={id}
                                            onFocus={this.onFocus}
                                            onBlur={this.onBlur}
                                            onChange={this.onChange}
                                            type={propType}
                                            checked={this.state.value as boolean}
                                            onKeyUp={this.props.onKeyUp} />
                                    </div>
                                    : propType == 'date' ?
                                        this.props.isDisabled ?
                                            <input style={{ minWidth: "unset", width: "100%" }}
                                                className={inputClasses}
                                                disabled={true}
                                                placeholder={''}
                                                value={this.formatDate(this.state.value as string | Date | Moment | undefined)} /> :
                                            <Datetime
                                                locale={eitAppConfig.locale}
                                                value={this.state.value as DateInputValueType }
												closeOnSelect={false}
                                                inputProps={{
                                                    placeholder: '',
                                                    style: { width: "100%" },
													className: inputClasses,
                                                }}
                                                timeFormat={false}
                                                dateFormat={'DD.MM.YYYY'}
                                                onFocus={this.onFocus}
												onBlur={this.onDateBlur}
                                                onChange={this.onDateChange}
                                                isValidDate={this.isValidDate}/>
                                        :
                                        this.props.autoComplete && !this.props.isDisabled ?
                                            <Autocomplete
												key={id}
												searchTerm={this.props.value as string | undefined}
												placeholder={''}
                                                containerStyle={{ maxWidth: "none", width: "100%", display: "block", borderRadius:"0", boxShadow: "none", outline: "none" }}
                                                inputStyle={{ maxWidth: "none", width:"100%", display: "inline-block", border: "0px", borderRadius:"0", boxShadow: "none", outline: "none"}}
                                                resultListContainerStyle={{ minWidth: 207, backgroundColor: "white", background: "" }}
												onChangeHandler={(inputText) => { this.updateState(inputText, false); }}
												onSelectHandler={this.props.onAutoCompleteSelection}
                                                onFocusHandler={this.onFocus}
                                                onBlurHandler={this.onBlur}
                                                searchLayerInfo={this.props.autoCompleteSearchLayerInfo}
												searchType={QueryType.both}
												isDataReturnedAutocomplete={this.props.isDataReturnedAutocomplete}
												size="M"
												maxRecords={5}
												noDataText={this.props.placeholder === nls.nls.serviceWizard.requestAddresseeTitleByService["51"] ? nls.nls.serviceWizard.notInEDelivery : "Не е открито нищо"}
                                            /> :
										<input style={{ minWidth: "unset", width: "100%" }}
											className={inputClasses}
											required={this.props.isRequired}
											disabled={this.props.isDisabled}
											id={id}
											onFocus={this.onFocus}
											onBlur={this.onBlur}
											onChange={this.onChange}
											type={propType}
											maxLength={this.props.maxLength}
											value={this.state.value as string | number | undefined}
											onKeyUp={this.props.onKeyUp} />

					}
				</div>
				{
                    //(!!(this.props.isMultiline)) ?
                    false?
                        <span className={inputClasses}
                            style={{ minHeight: "0px", height: "1px", width: "100%", marginBottom: "0px", marginTop: "0px", paddingBottom: "0px", paddingTop: "0px" }}>&nbsp;</span> :
                        null
				}
				{/*
					
					(!!(this.props.isMultiline)) ? (<hr className={inputClasses} style={{height:"2px", width:"100%", 
						marginBottom:"0px", marginTop:"0px", paddingBottom:"0px", paddingTop:"0px" }}/>) : (null)
				*/}
			</div>
		);
	}
}

export default connect<{}, DispatchProps, ParentProps>(null, {})(FloatingLabelInput);
