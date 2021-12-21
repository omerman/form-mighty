import { Object, String } from "ts-toolbelt";
import { DefaultFormValues } from ".";

export namespace FieldPath {
  export type FieldPath<
    V extends DefaultFormValues = DefaultFormValues,
    Path extends string = string
  > = Path & { $$V: V };

  export type InferFieldValue<FP extends FieldPath<any, any>> =
    FP extends FieldPath<infer V, infer Path>
      ? Object.Path<V, String.Split<Path, ".">>
      : never;
}
