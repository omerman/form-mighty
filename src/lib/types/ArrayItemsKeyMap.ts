import { Object, String } from "ts-toolbelt";
import { DottedPaths } from "./DottedPath";

type FlattenArraysDeep<V> = {
  [Key in keyof V]: V[Key] extends Array<any>
    ? FlattenArraysDeep<V[Key][number]> & {
        _$OBJECTS_ARRAY_MARKER_$_: V[Key][number] extends object ? true : false;
      }
    : FlattenArraysDeep<V[Key]>;
};

export type ArrayItemsKeyMap<V> = {
  [Path in DottedPaths<FlattenArraysDeep<V>> as Object.Path<
    FlattenArraysDeep<V>,
    String.Split<Path, ".">
  > extends { _$OBJECTS_ARRAY_MARKER_$_: true }
    ? Path
    : never]?: Exclude<
    keyof Object.Path<FlattenArraysDeep<V>, String.Split<Path, ".">>,
    "_$OBJECTS_ARRAY_MARKER_$_"
  >;
};
