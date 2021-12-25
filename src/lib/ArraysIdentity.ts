export class ArraysIdentity {
  private arraysIdentity = new WeakMap<any[], keyof any>();

  add<T>(a: T[] | undefined, b: keyof T) {
    if (a) {
      this.arraysIdentity.set(a, b);
    }
  }

  get<T>(a: T[]) {
    return this.arraysIdentity.get(a);
  }
}
