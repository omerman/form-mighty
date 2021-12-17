import { FormState } from "../types";

export const updateFormState = (
  uniqueKey: string,
  formState: FormState<any>
) => ({
  type: "@FORM_MIGHTY/updateFormState" as const,
  payload: { uniqueKey, formState },
});

export const disposeForm = (uniqueKey: string) => ({
  type: "@FORM_MIGHTY/disposeForm" as const,
  payload: { uniqueKey },
});
