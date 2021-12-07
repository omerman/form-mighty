import { get, set } from "lodash";
import React from "react";
import { useSelector } from "react-redux";
import { FieldPath } from "./types/FieldPath";
import { useForm } from "./useForm";

export type FieldDescriptor<FP extends FieldPath.FieldPath<any, any> = string> = {
  value: FieldPath.InferFieldValue<FP>;
  onChange: (e?: FieldPath.InferFieldValue<FP> | React.ChangeEvent<HTMLInputElement>) => void;
}

export interface FieldProps<FP extends FieldPath.FieldPath<any, any> = string> {
  fieldPath: FP extends string ? FP : never;
  children: (descriptor: FieldDescriptor<FP>, dirty: boolean) => React.ReactNode;
}

export const Field: <FP extends FieldPath.FieldPath<any, any> = string>(
  props: FieldProps<FP>
) => React.ReactElement<any, any> | null = ({ children, fieldPath }) => {
  const toolkit = useForm();
  const value = useSelector(() => get(toolkit.getState().values, fieldPath as any));

  const fieldProps: FieldDescriptor<FieldPath.FieldPath<{}, string>> = {
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

  return <>{children(fieldProps, true)}</>;
};
