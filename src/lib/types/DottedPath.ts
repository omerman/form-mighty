import { List, Object } from "ts-toolbelt";

type Join<T extends List.List, D extends string> = T extends []
  ? ""
  : T extends [(string | number | boolean)?]
  ? `${T[0]}`
  : T extends [(string | number | boolean)?, ...infer U]
  ? string extends T[0]
    ? `${T[0]}${D}${Join<U, D>}`
    : `${T[0]}${D}${Join<U, D>}` | `${T[0]}`
  : never;

export type DottedPaths<V> = Join<Object.Paths<V>, ".">;
