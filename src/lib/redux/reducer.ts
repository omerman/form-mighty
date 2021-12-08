import { get } from "lodash";
import produce from "immer";
import { RootAction, RootState } from "./types";

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
        const { uniqueKey, nextValues, isStartValidation, appliedPatches } = action.payload;
        draft[uniqueKey].values = nextValues;
        draft[uniqueKey].isValidating = isStartValidation;

        appliedPatches.forEach(patch => {
          patch.path.forEach((path, pathIndex) => {
            const parentPath = patch.path.slice(0, pathIndex).join('.');
            const prefix = parentPath === '' ? '' : `${parentPath}.`;
            const fullPath = `${prefix}${path}`;

            draft[uniqueKey].dirtyFields[fullPath] = patch.value !== get(state[uniqueKey].initialValues, fullPath);
          });
        });


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
