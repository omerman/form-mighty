import { Patch } from "immer";
import { get, size, differenceBy, entries, concat } from "lodash";
import { PatchUtils } from "./PatchUtils";

export class DirtyPathsFinder {
  static find(
    appliedPatches: Omit<Patch, "op">[],
    appliedValues: any,
    initialValues: any,
    currentDirtyPaths: Record<string, boolean>
  ) {
    const touchedPathList = PatchUtils.buildVisitedPaths(appliedPatches)
      .sort((a, b) => (a < b ? 1 : -1))
      .sort((a, b) => b.length - a.length);

    const nextDirtyFields: Record<string, boolean> = {};

    touchedPathList.forEach((path) => {
      const initialValue = get(initialValues, path);
      const value = get(appliedValues, path);

      const markAsDirty = (path: string) => {
        nextDirtyFields[path] = true;
      };

      if (
        !["undefined", "object", "string", "number", "boolean"].includes(
          typeof value
        ) ||
        !["undefined", "object", "string", "number", "boolean"].includes(
          typeof initialValue
        )
      ) {
        return;
      }

      if (value === initialValue) {
        nextDirtyFields[path] = false;
        return;
      } else if (typeof initialValue !== "object") {
        markAsDirty(path);
        return;
      }

      if (size(initialValue) !== size(value)) {
        const missingInitialValues = differenceBy(
          entries(initialValue),
          entries(value),
          (a) => a[0]
        );

        PatchUtils.buildVisitedPaths(
          concat(missingInitialValues).map(([key, value]) => ({
            path: [...path.split("."), key],
            value,
          }))
        ).forEach((path) => {
          markAsDirty(path);
        });
      }

      // Minor optimization
      if (nextDirtyFields[path]) {
        return;
      }

      const subPathsEntries = entries({
        ...currentDirtyPaths,
        ...nextDirtyFields,
      }).filter(([key]) => {
        return key !== path && key.startsWith(path);
      });

      const hasAnyChildren = subPathsEntries.length > 0;

      const hasDirtyChildren = subPathsEntries.some(([, value]) => value);

      nextDirtyFields[path] =
        hasDirtyChildren || (!hasAnyChildren && value !== initialValue);
    });

    return nextDirtyFields;
  }
}
