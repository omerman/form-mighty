import { FormState } from "../types";

export const updateFormState = (
  uniqueKey: string,
  formState: FormState<any>
) => ({
  type: "@FORM_MIGHTY/updateFormState" as const,
  payload: { uniqueKey, formState },
});
