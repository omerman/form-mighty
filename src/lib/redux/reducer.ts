import { entries, get, isEmpty } from "lodash";
import produce, { Patch } from "immer";
import { RootAction, RootState } from "./types";
import { PatchUtils } from "../utils/PatchUtils";

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

        const resolvedPatches = appliedPatches.reduce<Patch[]>(
          (result, patch) => {
            if (patch.op === "add") {
              return PatchUtils.toDeepAddedPatches(patch.value, patch.path);
            } else if (patch.op === "replace" && isEmpty(patch.value)) {
              return PatchUtils.toDeepRemovedPatches(
                get(state[uniqueKey].values, patch.path),
                patch.path,
                patch.value
              );
            } else {
              return [...result, patch];
            }
          },
          []
        );

        resolvedPatches.forEach((patch) => {
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
