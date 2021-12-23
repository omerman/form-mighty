import { Object, String } from "ts-toolbelt";
import { DottedPaths } from "./DottedPath";

type ArrayDefinitionsObjectHelper<V> = {
  [Key in keyof V as V[Key] extends Array<any>
    ? Key
    : never]: V[Key] extends Array<any>
    ? ArrayDefinitionsObjectHelper<V[Key][number]>
    : never;
};

// TODO - think of a way to clean this insane type, that works btw ;)~;
export type ArrayItemsKeyMap<V> = {
  [Path in DottedPaths<ArrayDefinitionsObjectHelper<V>>]?: keyof Exclude<
    Object.Path<
      V,
      [
        ...String.Split<
          String.Join<String.Split<Path, ".">, `.${number}.`>,
          "."
        >,
        number
      ]
    >,
    undefined
  >;
};
