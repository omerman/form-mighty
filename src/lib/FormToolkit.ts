import { Function } from "ts-toolbelt";
import produce, { Draft, Patch } from "immer";
import { uniqueId, get } from "lodash";
import { disposeForm, updateFormState } from "./redux/actions";
import { store } from "./redux/store";
import {
  FormState,
  DefaultFormValues,
  FormToolkitOptions,
  FieldPath,
} from "./types";
import { WritableDraft } from "immer/dist/internal";
import { DirtyPathsFinder } from "./utils/DirtyPathsFinder";

export class FormToolkit<V extends DefaultFormValues> {
  public readonly formKey: string;

  private state!: FormState<V>;

  private validationPromise = Promise.resolve({
    timestamp: Date.now(),
    isValid: true,
  });

  constructor(private readonly options: FormToolkitOptions<V> = {}) {
    this.formKey = uniqueId("form-");

    this.updateState({
      values: options.initialValues as V,
      initialValues: options.initialValues ?? {},
      isValid: options.initialIsValid ?? true,
      isValidating: options.initialIsValidating ?? true,
      dirtyFields: {},
    });

    if (this.state.isValidating) {
      const initialValidationPromise = this.validate();
      this.validationPromise = new Promise(async (resolve) => {
        const result = await initialValidationPromise;

        resolve({
          timestamp: Date.now(),
          isValid: result,
        });
      });
    }

    this.submit = this.submit.bind(this);
  }

  getState(): FormState<V> {
    return this.state;
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
    const appliedPatches: Patch[] = [];
    const nextValues = produce(
      this.getState().values,
      arg as any,
      (_appliedPatches) => {
        appliedPatches.push(..._appliedPatches);
      }
    );

    if (appliedPatches.length > 0) {
      this.updateState((draft) => {
        draft.values = nextValues as any;
        draft.isValidating = isStartValidation;

        Object.assign(
          draft.dirtyFields,
          DirtyPathsFinder.find(
            appliedPatches,
            draft.values,
            draft.initialValues,
            draft.dirtyFields
          )
        );
      });

      if (isStartValidation) {
        this.validate();
      }
    }
  }

  async submit() {
    const { isValid } = await this.validationPromise;

    if (isValid) {
      this.options.onSubmit?.(this.getState().values);
    }
  }

  async validate() {
    const { values } = this.getState();

    const { timestamp, isValid } = await this.validationPromise;

    if (timestamp < Date.now()) {
      this.validationPromise = new Promise(async (resolve) => {
        this.updateState((draft) => {
          draft.isValidating = true;
        });

        const result = (await this.options.validate?.(values)) ?? true;

        this.updateState((draft) => {
          draft.isValidating = false;
          draft.isValid = result;
        });

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

  private updateState(
    updater: FormState<V> | ((draft: WritableDraft<FormState<V>>) => void)
  ) {
    const nextState =
      typeof updater === "function" ? produce(this.state, updater) : updater;

    this.state = nextState;
    store.dispatch(updateFormState(this.formKey, this.state));
  }

  dispose() {
    store.dispatch(disposeForm(this.formKey));
  }

  subscribe() {
    throw new Error("Not implemented");
  }
}
