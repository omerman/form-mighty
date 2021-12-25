export type ArraysIdentityBuilder = {
  add<T>(array: T[] | undefined, id: keyof T): void;
};
