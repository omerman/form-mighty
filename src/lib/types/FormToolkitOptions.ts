import { DefaultFormValues } from ".";
import { ArrayItemsKeyMap } from "./ArrayItemsKeyMap";

export interface FormToolkitOptions<
  V extends DefaultFormValues = DefaultFormValues
> {
  initialValues?: Partial<V>;
  validate?: (values: V) => boolean | Promise<boolean>;
  initialIsValid?: boolean;
  initialIsValidating?: boolean;
  onSubmit?: (values: V) => void | Promise<void>;
  arrayItemsKeyMap?: ArrayItemsKeyMap<V>;
}
