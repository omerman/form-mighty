import { Function } from "ts-toolbelt";
import produce, { Draft, Patch } from "immer";
import invariant from "invariant";
import { uniqueId, get } from "lodash";
import {
  completeValidation,
  registerForm,
  startValidation,
  updateFormValues,
} from "./redux/actions";
import { store } from "./redux/store";
import {
  FormState,
  DefaultFormValues,
  FormToolkitOptions,
  FieldPath,
} from "./types";

export class FormToolkit<V extends DefaultFormValues> {
  public readonly formKey: string;

  private readonly initialState: FormState<V>;

  private validationPromise = Promise.resolve({
    timestamp: Date.now(),
    isValid: true,
  });

  constructor(private readonly options: FormToolkitOptions<V>) {
    this.formKey = uniqueId("form-");

    this.initialState = {
      values: options.initialValues as V,
      initialValues: options.initialValues ?? {},
      isValid: options.initialIsValid ?? true,
      isValidating: options.initialIsValidating ?? true,
      dirtyFields: {},
    };
  }

  isRegistered() {
    return store.getState()[this.formKey] !== undefined;
  }

  register() {
    invariant(!this.isRegistered(), "FormToolkit - Form already registered!");

    store.dispatch(registerForm(this.formKey, this.initialState));

    if (this.initialState.isValidating) {
      this.validate();
    }
  }

  getState() {
    if (this.isRegistered()) {
      return store.getState()[this.formKey];
    } else {
      return this.initialState;
    }
  }

  isFieldDirty<P extends string>(path: Function.AutoPath<V, P>): boolean {
    return get(this.getState().dirtyFields, path) ?? false;
  }

  path<P extends string>(
    path: Function.AutoPath<V, P>
  ): FieldPath.FieldPath<V, P> {
    return path as any as FieldPath.FieldPath<V, P>;
  }

  updateValues(
    arg: (valuesDraft: Draft<V>) => void | V,
    isStartValidation = true
  ) {
    const patches: Patch[] = [];
    const nextValues = produce(
      this.getState().values,
      arg as any,
      (appliedPatches) => {
        patches.push(...appliedPatches);
      }
    );

    if (patches.length > 0) {
      store.dispatch(
        updateFormValues(this.formKey, nextValues, patches, isStartValidation)
      );

      if (isStartValidation) {
        this.validate();
      }
    }
  }

  async validate() {
    const { values } = this.getState();

    const { timestamp, isValid } = await this.validationPromise;

    if (timestamp < Date.now()) {
      this.validationPromise = new Promise(async (resolve) => {
        store.dispatch(startValidation(this.formKey));

        const result = (await this.options.validate?.(values)) ?? true;

        store.dispatch(completeValidation(this.formKey, result));
        return resolve({
          isValid: result,
          timestamp: Date.now(),
        });
      });

      return this.validationPromise.then(({ isValid }) => isValid);
    } else {
      return isValid;
    }
  }

  subscribe() {
    throw new Error("Not implemented");
  }
}
