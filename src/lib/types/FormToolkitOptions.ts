import { DefaultFormValues } from ".";
import { ArraysIdentityBuilder } from "./ArraysIdentityBuilder";

export interface FormToolkitOptions<
  V extends DefaultFormValues = DefaultFormValues
> {
  initialValues?: Partial<V>;
  validate?: (values: V) => boolean | Promise<boolean>;
  initialIsValid?: boolean;
  initialIsValidating?: boolean;
  onSubmit?: (values: V) => void | Promise<void>;
  buildArraysIdentity?: (
    initialValues: Partial<V>,
    builder: ArraysIdentityBuilder
  ) => void;
}
