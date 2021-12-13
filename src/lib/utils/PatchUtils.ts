import { Patch } from "immer";
import { isEmpty } from "lodash";

export class PatchUtils {
  static buildVisitedPaths(list: Omit<Patch, "op">[]) {
    return list.reduce<string[]>((result, patch) => {
      return [
        ...result,
        ...patch.path.reduce<string[]>(
          (res, path, index) => [
            ...res,
            index === 0
              ? `${path}`
              : `${patch.path.slice(0, index).join(".")}.${path}`,
          ],
          []
        ),
        ...(typeof patch.value === "object" && !isEmpty(patch.value)
          ? PatchUtils.buildObjectPaths(patch.value, patch.path.join("."))
          : []),
      ];
    }, []);
  }

  private static buildObjectPaths(obj: any, prefix: string): string[] {
    if (typeof obj !== "object") return [];

    return Object.keys(obj).reduce<string[]>((result, key) => {
      return [
        ...result,
        `${prefix}.${key}`,
        ...PatchUtils.buildObjectPaths(obj[key], `${prefix}.${key}`),
      ];
    }, []);
  }
}
