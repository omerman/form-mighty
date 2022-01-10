import { Patch } from "immer";
import { get, size, differenceBy, entries, concat } from "lodash";
import { ArraysIdentity } from "../ArraysIdentity";
import { PatchUtils } from "./PatchUtils";

export class DirtyPathsFinder {
  static find(
    appliedPatches: Omit<Patch, "op">[],
    appliedValues: any,
    initialValues: any,
    currentDirtyPaths: Record<string, boolean>,
    arraysIdentity: ArraysIdentity
  ) {
    const touchedPathList = PatchUtils.buildVisitedPaths(appliedPatches)
      .sort((a, b) => (a < b ? 1 : -1))
      .sort((a, b) => b.length - a.length);

    const nextDirtyFields: Record<string, boolean> = {};

    touchedPathList.forEach((path) => {
      const parentPath = path.slice(0, path.lastIndexOf("."));

      const parentInitialValue = get(initialValues, parentPath);

      const arrayKey = Array.isArray(parentInitialValue)
        ? arraysIdentity.get(parentInitialValue)
        : undefined;

      const value = get(appliedValues, path);
      const initialValue = arrayKey
        ? (parentInitialValue as any[])?.find(
            (x) => x[arrayKey] === value[arrayKey]
          )
        : get(initialValues, path);

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
      } else {
        if (size(initialValue) !== size(value)) {
          const cleanMissingInitialValues = differenceBy(
            entries(initialValue),
            entries(value),
            (a) => a[0]
          ).filter(([key]) => {
            return !currentDirtyPaths[`${path}.${key}`];
          });

          PatchUtils.buildVisitedPaths(
            concat(cleanMissingInitialValues).map(([key, value]) => ({
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

        const hasDirtyChildren = subPathsEntries.some(([, value]) => value);

        nextDirtyFields[path] = hasDirtyChildren;
      }
    });

    return nextDirtyFields;
  }
}
