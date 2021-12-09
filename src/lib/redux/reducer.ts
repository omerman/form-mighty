import { entries, get, some } from "lodash";
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
        const { uniqueKey, nextValues, isStartValidation, appliedPatches } =
          action.payload;
        draft[uniqueKey].values = nextValues;
        draft[uniqueKey].isValidating = isStartValidation;

        appliedPatches.forEach((patch) => {
          [...patch.path].reverse().forEach((path, pathIndex) => {
            const parentPath = patch.path
              .slice(0, patch.path.length - pathIndex - 1)
              .join(".");

            const hasParent = parentPath !== "";

            const prefix = hasParent ? `${parentPath}.` : "";
            const fullPath = `${prefix}${path}`;

            const childrenEntries = entries(
              draft[uniqueKey].dirtyFields
            ).filter(([key, value]) => {
              return key !== fullPath && key.startsWith(fullPath);
            });

            const hasAnyChildren = childrenEntries.length > 0;

            const hasDirtyChildren = childrenEntries.some(([, value]) => value);

            draft[uniqueKey].dirtyFields[fullPath] =
              hasDirtyChildren ||
              (!hasAnyChildren &&
                patch.value !== get(draft[uniqueKey].initialValues, fullPath));
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
