import produce from "immer";
import { RootAction, RootState } from "./types";
import { DirtyPathsFinder } from "../utils/DirtyPathsFinder";

const initialState: RootState = {};

export const reducer = (state = initialState, action: RootAction) => {
  return produce(state, (draft) => {
    switch (action.type) {
      case "@FORM_MIGHTY/RegisterForm": {
        const { uniqueKey, initialState } = action.payload;
        draft[uniqueKey] = initialState;
        break;
      }
      case "@FORM_MIGHTY/UpdateFormValues": {
        const { uniqueKey, nextValues, isStartValidation, appliedPatches } =
          action.payload;
        draft[uniqueKey].values = nextValues;
        draft[uniqueKey].isValidating = isStartValidation;

        Object.assign(
          draft[uniqueKey].dirtyFields,
          DirtyPathsFinder.find(
            appliedPatches,
            draft[uniqueKey].values,
            draft[uniqueKey].initialValues,
            draft[uniqueKey].dirtyFields
          )
        );

        break;
      }
      case "@FORM_MIGHTY/StartValidation": {
        const { uniqueKey } = action.payload;
        draft[uniqueKey].isValidating = true;
        break;
      }
      case "@FORM_MIGHTY/CompleteValidation": {
        const { uniqueKey, result } = action.payload;
        draft[uniqueKey].isValid = result;
        draft[uniqueKey].isValidating = false;
      }
    }
  });
};
