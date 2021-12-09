import { DefaultFormValues } from "./DefaultFormValues";

export interface FormState<V extends DefaultFormValues = DefaultFormValues> {
  initialValues: Partial<V>;
  values: V;
  isValid: boolean;
  isValidating: boolean;
  dirtyFields: {
    [key: string]: boolean;
  };
}
