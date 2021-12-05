import { List } from "ts-toolbelt";

export type DottedPath<T extends List.List<any>> = T[0] extends never ?
'' : `${List.Take<T, 1>[0]}` | `${List.Take<T, 1>[0]}${DottedPath<Exclude<List.Tail<T>, []>> extends '' ? '' : `.${DottedPath<Exclude<List.Tail<T>, []>>}`}`;
