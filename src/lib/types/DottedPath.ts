import { List } from "ts-toolbelt";
import { Paths } from "ts-toolbelt/out/Object/Paths";

type Join<T extends List.List, D extends string> = T extends []
  ? ""
  : T extends [(string | number | boolean)?]
  ? `${T[0]}`
  : T extends [(string | number | boolean)?, ...infer U]
  ? `${T[0]}` | `${T[0]}${D}${Join<U, D>}`
  : never;

export type DottedPaths<V> = Join<Paths<V>, ".">;
