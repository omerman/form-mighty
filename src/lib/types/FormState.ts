import { Object } from "ts-toolbelt";
import { DefaultFormValues } from "./DefaultFormValues";
import { DottedPaths } from "./DottedPaths";

export interface FormState<V extends DefaultFormValues> {
  initialValues: Partial<V>;
  values: V;
  isValid: boolean;
  isValidating: boolean;
  dirtyFields: {
    [Key in DottedPaths<Object.Paths<V>>]?: string;
  }
}
