import { Patch } from "immer";
import { entries } from "lodash";

export class PatchUtils {
  static toDeepAddedPatches(
    anyValue: any,
    basePath: (string | number)[]
  ): Patch[] {
    if (typeof anyValue !== "object") {
      return [
        {
          op: "add",
          path: basePath,
          value: anyValue,
        },
      ];
    }

    return entries(anyValue).reduce<Patch[]>(
      (result, [key, value]) => [
        ...result,
        ...PatchUtils.toDeepAddedPatches(value, [...basePath, key]),
      ],
      []
    );
  }
  static toDeepRemovedPatches(
    anyValue: any,
    basePath: (string | number)[],
    resetValue?: any
  ): Patch[] {
    if (typeof anyValue !== "object") {
      return [
        {
          op: "replace", // We currently dont have any remove usecases.
          path: basePath,
          value: resetValue,
        },
      ];
    }

    return entries(anyValue).reduce<Patch[]>(
      (result, [key, value]) => [
        ...result,
        ...PatchUtils.toDeepRemovedPatches(value, [...basePath, key]),
      ],
      []
    );
  }
}
