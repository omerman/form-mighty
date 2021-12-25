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
import { DottedPaths } from "./types/DottedPath";

export class FormToolkit<V extends DefaultFormValues> {
  public readonly formKey: string;

  private state!: FormState<V>;

  private validationToken!: string;

  private validationPromise!: Promise<boolean>;

  constructor(private readonly options: FormToolkitOptions<V> = {}) {
    this.formKey = uniqueId("form-");

    this.setState({
      values: (options.initialValues ?? {}) as V,
      initialValues: options.initialValues ?? {},
      isValid: options.initialIsValid ?? true,
      isValidating: options.initialIsValidating ?? true,
      dirtyFields: {},
      isSubmitting: false,
    });

    if (this.state.isValidating) {
      this.validate();
    } else {
      this.validationPromise = Promise.resolve(this.state.isValid);
    }

    this.submit = this.submit.bind(this);
  }

  getState(): FormState<V> {
    return this.state;
  }

  isFieldDirty<P extends DottedPaths<V>>(path: P): boolean {
    return get(this.getState().dirtyFields, path) ?? false;
  }

  path<P extends DottedPaths<V>>(path: P): FieldPath.FieldPath<V, P> {
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
      this.setState((draft) => {
        draft.values = nextValues as any;
        draft.isValidating = isStartValidation;

        Object.assign(
          draft.dirtyFields,
          DirtyPathsFinder.find(
            appliedPatches,
            nextValues,
            this.state.initialValues,
            this.state.dirtyFields,
            (this.options.arrayItemsKeyMap ?? {}) as Record<string, string>
          )
        );
      });

      if (isStartValidation) {
        this.validate();
      }
    }
  }

  async submit() {
    const isValid = await this.validationPromise;

    if (isValid) {
      this.setState((draft) => {
        draft.isSubmitting = true;
      });
      await this.options.onSubmit?.(this.getState().values);
      this.setState((draft) => {
        draft.isSubmitting = false;
      });
    }
  }

  async validate() {
    this.validationPromise = new Promise(async (resolve) => {
      const validationToken = uniqueId("validation-token");

      this.validationToken = validationToken;

      const { values } = this.getState();

      this.setState((draft) => {
        draft.isValidating = true;
      });

      setImmediate(async () => {
        // No need to even begin the validation if call already expired.
        if (validationToken !== this.validationToken) {
          return resolve(this.getState().isValid);
        }

        const result =
          (await this.options.validate?.(values)) ?? this.getState().isValid;

        // Skip if the result is considered expired.
        if (validationToken !== this.validationToken) {
          return resolve(this.getState().isValid);
        }

        this.setState((draft) => {
          draft.isValidating = false;
          draft.isValid = result;
        });

        return resolve(result);
      }, 60);
    });

    return this.validationPromise;
  }

  private setState(
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
