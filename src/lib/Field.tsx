import { get, set } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { All } from "./types";
import { FieldPath } from "./types/FieldPath";
import { useForm } from "./useForm";
import { EventUtils } from "./utils/EventUtils";

export interface FieldProps<FP extends FieldPath.FieldPath<any, any> = string> {
  fieldPath: FP extends string ? FP : string;
  children: (
    descriptor: FieldDescriptor<FP>,
    fieldState: { isDirty: boolean; isValid: boolean }
  ) => React.ReactNode;
  validate?: (value: FieldPath.InferFieldValue<FP>) => boolean;
}

export const Field = <FP extends FieldPath.FieldPath<any, any> = string>({
  children,
  fieldPath,
  validate,
}: FieldProps<FP>) => {
  const toolkit = useForm();
  const value = useSelector(() => get(toolkit.getState().values, fieldPath));
  const isDirty = useSelector(() => toolkit.isFieldDirty(fieldPath));
  const [isValid, setIsValid] = useState(true);

  const refs = useRef({ validate });
  Object.assign(refs.current, { validate });

  useEffect(() => {
    setIsValid(refs.current.validate?.(value) ?? true);
  }, [value]);

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

  return <>{children(descriptor, { isDirty, isValid })}</>;
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
