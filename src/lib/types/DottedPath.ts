import { List } from "ts-toolbelt";

export type DottedPath<T extends List.List<any>, PX extends string = ''> = 
List.Length<T> extends 0 ? PX : PX extends '' ? DottedPath<Exclude<List.Tail<T>, []>, `${List.Take<T, 1>[0]}`> : PX | DottedPath<Exclude<List.Tail<T>, []>, `${PX}.${List.Take<T, 1>[0]}`>;
