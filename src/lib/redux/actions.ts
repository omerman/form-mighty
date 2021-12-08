import { Patch } from "immer";
import { FormState, DefaultFormValues } from "../types";

export const registerForm = <V extends DefaultFormValues>(
  uniqueKey: string,
  initialState: FormState<V>
) => ({
  type: "@FORM_MIGHTY/RegisterForm" as const,
  payload: { uniqueKey, initialState: initialState },
});

export const updateFormValues = <V extends DefaultFormValues>(
  uniqueKey: string,
  nextValues: V,
  appliedPatches: Patch[],
  isStartValidation = true
) => ({
  type: "@FORM_MIGHTY/UpdateFormValues" as const,
  payload: { uniqueKey, nextValues, isStartValidation, appliedPatches },
});

export const startValidation = (uniqueKey: string) => ({
  type: "@FORM_MIGHTY/StartValidation" as const,
  payload: { uniqueKey },
});

export const completeValidation = (uniqueKey: string, result: boolean) => ({
  type: "@FORM_MIGHTY/CompleteValidation" as const,
  payload: { uniqueKey, result },
});
