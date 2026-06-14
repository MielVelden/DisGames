import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { TextInputStyle } from "./Message";

export interface ModalTextField {
    label: MultiLingualString;
    style?: TextInputStyle;                  // default SHORT
    placeholder?: MultiLingualString;
    value?: MultiLingualString | string;     // initial value
    required?: boolean;                       // default true
    minLength?: number;
    maxLength?: number;
    parse?: (raw: string) => unknown;         // optional typed transform
}

export interface ModalDefinition<TFields extends Record<string, ModalTextField>> {
    title: MultiLingualString;
    fields: TFields;
}

// Infer the value type per field from `parse`, else string
export type ModalResult<TFields extends Record<string, ModalTextField>> = {
    [K in keyof TFields]: TFields[K] extends { parse: (raw: string) => infer T } ? T : string;
};
