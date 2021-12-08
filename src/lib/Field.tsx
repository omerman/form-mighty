import { get, set } from "lodash";
import React from "react";
import { useSelector } from "react-redux";
import { FieldPath } from "./types/FieldPath";
import { useForm } from "./useForm";

export interface FieldProps<FP extends FieldPath.FieldPath<any, any> = string> {
  fieldPath: FP extends string ? FP : string;
  children: (descriptor: FieldDescriptor<FP>, dirty: boolean) => React.ReactNode;
}

export const Field: <FP extends FieldPath.FieldPath<any, any> = string>(
  props: FieldProps<FP>
) => React.ReactElement<any, any> | null = ({ children, fieldPath }) => {
  const toolkit = useForm();
  const value = useSelector(() => get(toolkit.getState().values, fieldPath));
  const dirty = useSelector(() => toolkit.isFieldDirty(fieldPath));

  const descriptor: FieldDescriptor<FieldPath.FieldPath<{}, string>> = {
    value,
    onChange: (e) => {
      toolkit.updateValues(draft => {
        if (e?.nativeEvent instanceof Event) {
          set(draft, fieldPath, e.target.value);
        } else {
          set(draft, fieldPath, e);
        }
      });
      
    },
  };

  return <>{children(descriptor, dirty)}</>;
};

export type FieldDescriptor<FP extends FieldPath.FieldPath<any, any> = string> = {
  value: FieldPath.InferFieldValue<FP>;
  onChange: (e?: FieldPath.InferFieldValue<FP> | React.ChangeEvent<HTMLInputElement>) => void;
}