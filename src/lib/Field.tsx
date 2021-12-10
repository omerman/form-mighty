import { get, set } from "lodash";
import React from "react";
import { useSelector } from "react-redux";
import { All } from "./types";
import { FieldPath } from "./types/FieldPath";
import { useForm } from "./useForm";
import { EventUtils } from "./utils/EventUtils";

export interface FieldProps<FP extends FieldPath.FieldPath<any, any> = string> {
  fieldPath: FP extends string ? FP : string;
  children: (
    descriptor: FieldDescriptor<FP>,
    dirty: boolean
  ) => React.ReactNode;
}

export const Field = <FP extends FieldPath.FieldPath<any, any> = string>({
  children,
  fieldPath,
}: FieldProps<FP>) => {
  const toolkit = useForm();
  const value = useSelector(() => get(toolkit.getState().values, fieldPath));
  const dirty = useSelector(() => toolkit.isFieldDirty(fieldPath));

  const descriptor: FieldDescriptor<FP> = {
    value,
    onChange: (e) => {
      toolkit.updateValues((draft) => {
        if (EventUtils.isSyntheticEvent(e)) {
          set(draft, fieldPath, e.target.value);
        } else {
          set(draft, fieldPath, e);
        }
      });
    },
  };

  return <>{children(descriptor, dirty)}</>;
};

export type FieldDescriptor<FP extends FieldPath.FieldPath<any, any> | string> =
  {
    value: FieldPath.InferFieldValue<FP>;
    onChange: (
      e:
        | (string extends FP ? All : FieldPath.InferFieldValue<FP>)
        | React.ChangeEvent<HTMLInputElement>
    ) => void;
  };
