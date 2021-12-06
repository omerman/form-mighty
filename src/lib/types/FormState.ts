import { Object } from "ts-toolbelt";
import { DefaultFormValues } from "./DefaultFormValues";
import { DottedPath } from "./DottedPath";

export interface FormState<V extends DefaultFormValues> {
  initialValues: Partial<V>;
  values: V;
  isValid: boolean;
  isValidating: boolean;
  dirtyFields: {
    [Key in DottedPath<Object.Paths<V>>]?: string;
  }
}
