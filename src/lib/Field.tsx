import { get, set, uniqueId } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { EventUtils } from "./utils/EventUtils";
import { All, FieldPath } from "./types";
import { useFormSelector } from "./useFormSelector";
import { useForm } from "./useForm";

export interface FieldProps<FP extends FieldPath.FieldPath | string = string> {
  fieldPath: FP;
  children: (
    descriptor: FieldDescriptor<FP>,
    fieldState: { isDirty: boolean; isValid: boolean }
  ) => React.ReactNode;
  validate?: (
    value: FieldPath.InferFieldValue<FP>
  ) => boolean | Promise<boolean>;
}

export const Field = <FP extends FieldPath.FieldPath | string = string>({
  children,
  fieldPath,
  validate,
}: FieldProps<FP>) => {
  const toolkit = useForm();
  const value = useFormSelector((state) => get(state.values, fieldPath));
  const isDirty = useFormSelector(() =>
    toolkit.isFieldDirty(fieldPath as string)
  );
  const [isValid, setIsValid] = useState(true);

  const refs = useRef({ validate, validateToken: "" });
  Object.assign(refs.current, { validate });

  useEffect(() => {
    const validateId = (refs.current.validateToken = uniqueId());
    const result = refs.current.validate?.(value) ?? true;
    if (result instanceof Promise) {
      result.then((valid) => {
        if (validateId !== refs.current.validateToken) {
          return;
        }
        setIsValid(valid);
      });
    } else {
      setIsValid(result);
    }
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

export type FieldDescriptor<FP extends FieldPath.FieldPath | string> = {
  value: FP extends FieldPath.FieldPath ? FieldPath.InferFieldValue<FP> : any;
  onChange: (
    e:
      | (FP extends FieldPath.FieldPath ? FieldPath.InferFieldValue<FP> : All)
      | React.ChangeEvent<HTMLInputElement>
  ) => void;
};
