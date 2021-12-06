import { Object } from "ts-toolbelt";
import produce, { Draft } from "immer";
import invariant from "invariant";
import { uniqueId } from "lodash";
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
  FieldPath,
  FormToolkitOptions,
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
      isValid: options.isInitialValid ?? true,
      isValidating: options.isInitialRequiresValidation ?? true,
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

  updateValues(
    arg: (valuesDraft: Draft<V>) => void | V,
    isStartValidation = true
  ) {
    store.dispatch(
      updateFormValues(
        this.formKey,
        produce(this.getState().values, arg),
        isStartValidation
      )
    );

    if (isStartValidation) {
      this.validate();
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

  path<Path extends Object.Paths<V>>(path: Path): FieldPath.FieldPath<V, Path> {
    return path as FieldPath.FieldPath<V, Path>;
  }
}
