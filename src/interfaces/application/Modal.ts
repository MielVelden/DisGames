import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { TextInputStyle } from "./Message";

export interface ModalTextField {
    kind?: 'text';
    label: MultiLingualString;
    style?: TextInputStyle;                  // default SHORT
    placeholder?: MultiLingualString;
    value?: MultiLingualString | string;     // initial value
    required?: boolean;                       // default true
    minLength?: number;
    maxLength?: number;
    parse?: (raw: string) => unknown;         // optional typed transform
}

export interface ModalSelectOption {
    label: MultiLingualString;
    value: string;
    description?: MultiLingualString;
}

export interface ModalSelectField {
    kind: 'select';
    label: MultiLingualString;
    options: ModalSelectOption[];
    placeholder?: MultiLingualString;
    minValues?: number;
    maxValues?: number;
    parse?: (raw: string[]) => unknown;
}

export interface ModalRadioOption {
    label: MultiLingualString;
    value: string;
    description?: MultiLingualString;
    default?: boolean;
}

export interface ModalRadioField {
    kind: 'radio';
    label: MultiLingualString;
    options: ModalRadioOption[];
    required?: boolean;
    parse?: (raw: string) => unknown;
}

export type ModalField = ModalTextField | ModalSelectField | ModalRadioField;

export interface ModalDefinition<TFields extends Record<string, ModalField>> {
    title: MultiLingualString;
    fields: TFields;
}

// Infer the value type per field from `parse`, else string[] for selects and string for text inputs
export type ModalResult<TFields extends Record<string, ModalField>> = {
    [K in keyof TFields]:
        TFields[K] extends { parse: (raw: any) => infer T } ? T :
        TFields[K] extends { kind: 'select' } ? string[] :
        string;
};
