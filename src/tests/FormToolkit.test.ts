import { waitFor } from "@testing-library/react";
import { set } from "lodash";
import { FormToolkitOptions } from "src/lib";
import { FormToolkit } from "src/lib/FormToolkit";
import { waitForExpression, waitForTime } from "./utils";

it("Should work with no args", () => {
  new FormToolkit();
});

it("Should work with empty args", () => {
  new FormToolkit({});
});

describe("submit aspect", () => {
  describe("submit", () => {
    it("should call given onSubmit option", async () => {
      const opts: FormToolkitOptions = {
        onSubmit: jest.fn(),
        initialIsValidating: false,
      };

      const tk = new FormToolkit(opts);

      tk.submit();
      await waitFor(() => expect(opts.onSubmit).toHaveBeenCalledTimes(1));
    });

    it("should call given onSubmit option after validating is complete", async () => {
      const opts: FormToolkitOptions = {
        onSubmit: jest.fn(),
        validate: () =>
          new Promise((resolve) => setTimeout(() => resolve(true), 100)),
      };

      const tk = new FormToolkit(opts);

      tk.submit();
      expect(opts.onSubmit).not.toHaveBeenCalled();

      await waitFor(() => expect(opts.onSubmit).toHaveBeenCalledTimes(1));
    });

    it("should call given onSubmit option with values", async () => {
      const opts: FormToolkitOptions = {
        onSubmit: jest.fn(),
        initialValues: { ok: 5 },
        initialIsValidating: false,
      };

      const tk = new FormToolkit(opts);

      tk.submit();
      await waitFor(() =>
        expect(opts.onSubmit).toHaveBeenCalledWith(tk.getState().values)
      );
    });

    it("should call given onSubmit option with values after changed", async () => {
      const opts: FormToolkitOptions = {
        onSubmit: jest.fn(),
        initialValues: { ok: 5 },
      };

      const tk = new FormToolkit(opts);

      tk.updateValues((values) => {
        values.ok = 1000;
      });

      tk.submit();

      await waitFor(() =>
        expect(opts.onSubmit).toHaveBeenCalledWith(tk.getState().values)
      );
    });

    it("should not call given onSubmit option if form is invalid", () => {
      const opts: FormToolkitOptions = {
        onSubmit: jest.fn(),
        initialIsValid: false,
      };

      const tk = new FormToolkit(opts);

      tk.submit();

      expect(opts.onSubmit).not.toHaveBeenCalled();
    });

    it("should not call given onSubmit option if form will be invalid", async () => {
      const opts: FormToolkitOptions = {
        onSubmit: jest.fn(),
        initialIsValid: true,
        validate: () => false,
      };

      const tk = new FormToolkit(opts);

      tk.submit();

      await waitFor(() => expect(tk.getState().isValidating).toBe(false));

      expect(opts.onSubmit).not.toHaveBeenCalled();
    });

    it("should wait for onSubmit to finish if async", async () => {
      let isSubmitFinished = false;
      const opts: FormToolkitOptions = {
        onSubmit: jest.fn().mockImplementation(
          () =>
            new Promise<void>((resolve) =>
              setTimeout(() => {
                isSubmitFinished = true;
                resolve();
              }, 200)
            )
        ),
      };

      const tk = new FormToolkit(opts);

      await tk.submit();

      expect(isSubmitFinished).toBe(true);
    });

    it("should be bound to the class instace", async () => {
      const opts: FormToolkitOptions = {
        onSubmit: jest.fn(),
        initialIsValid: true,
        validate: () => false,
      };

      const { submit } = new FormToolkit(opts);

      await expect(submit()).resolves.not.toThrow();
    });
  });

  describe("state.isSubmitting", () => {
    it("should be false by default", () => {
      const tk = new FormToolkit();
      expect(tk.getState().isSubmitting).toBe(false);
    });

    it("should become true after submit and validation completed", async () => {
      const tk = new FormToolkit({
        onSubmit: () =>
          new Promise((resolve) => {
            setTimeout(resolve, 200);
          }),
      });

      tk.submit();
      await waitForExpression(() => tk.getState().isValidating, false);

      expect(tk.getState().isSubmitting).toBe(true);
    });

    it("should not become true after submit if form is invald", async () => {
      const tk = new FormToolkit({ initialIsValid: false });
      tk.submit();
      await waitForExpression(() => tk.getState().isValidating, false);
      expect(tk.getState().isSubmitting).toBe(false);
    });

    it("should become false after submition ends", async () => {
      const tk = new FormToolkit();
      await tk.submit();
      expect(tk.getState().isSubmitting).toBe(false);
    });
  });
});

describe("validation aspect", () => {
  const VALIDATE_DEBOUNCE_TIME = 60;

  describe("validate", () => {
    it("should be called uppon Instantioation, and async with initialValues", async () => {
      const opt: FormToolkitOptions = {
        validate: jest.fn().mockImplementation(() => true),
        initialValues: { a: 5 },
      };

      new FormToolkit(opt);

      expect(opt.validate).toHaveBeenCalledTimes(0);
      await waitForTime(VALIDATE_DEBOUNCE_TIME);

      expect(opt.validate).toHaveBeenCalledTimes(1);
      expect(opt.validate).toHaveBeenCalledWith(opt.initialValues);
    });

    it("should not be called uppon Instantioation if initialIsValidating=false", async () => {
      const opt: FormToolkitOptions = {
        validate: jest.fn().mockImplementation(() => true),
        initialValues: { a: 5 },
        initialIsValidating: false,
      };

      new FormToolkit(opt);

      await waitForTime(VALIDATE_DEBOUNCE_TIME);

      expect(opt.validate).toHaveBeenCalledTimes(0);
    });

    it("should be called uppon value change with next values", async () => {
      const opt: FormToolkitOptions = {
        validate: jest.fn().mockImplementation(() => true),
        initialValues: { a: 5 },
      };

      const f = new FormToolkit(opt);

      f.updateValues((v) => {
        v.a = 6;
      });

      await waitFor(() =>
        expect(opt.validate).toHaveBeenCalledWith(f.getState().values)
      );
    });

    it("should not wait for the previous validation when invoked", async () => {
      const FIRST_VALIDATE_DELAY = 200;

      const opt: FormToolkitOptions = {
        validate: jest
          .fn()
          .mockImplementationOnce(async () => {
            return new Promise((resolve) => {
              setTimeout(() => resolve(false), FIRST_VALIDATE_DELAY);
            });
          })
          .mockImplementationOnce(() => false),
        initialValues: { a: 5 },
        initialIsValidating: false,
      };

      const tk = new FormToolkit(opt);

      tk.validate();

      await waitForTime(VALIDATE_DEBOUNCE_TIME);

      tk.validate();

      await waitForTime(FIRST_VALIDATE_DELAY / 2);

      expect(tk.getState().isValid).toBe(false);
    });

    it("should not override isValid if result came back after a later invocation", async () => {
      const opt: FormToolkitOptions = {
        validate: jest
          .fn()
          .mockImplementationOnce(async () => {
            return new Promise((resolve) => {
              setTimeout(() => resolve(false), 200);
            });
          })
          .mockImplementationOnce(() => true),
        initialValues: { a: 5 },
        initialIsValidating: false,
      };

      const tk = new FormToolkit(opt);
      const firstCall = tk.validate();

      await waitForTime(VALIDATE_DEBOUNCE_TIME);

      tk.validate();

      await firstCall;

      expect(tk.getState().isValid).toBe(true);
    });

    it("should be called once(debounced) if multiple executive validations are triggered", async () => {
      const opt: FormToolkitOptions = {
        validate: jest
          .fn()
          .mockImplementationOnce(async () => {
            return new Promise((resolve) => {
              setTimeout(() => resolve(false), 200);
            });
          })
          .mockImplementationOnce(async () => {
            return new Promise((resolve) => {
              setTimeout(() => resolve(false), 200);
            });
          })
          .mockImplementationOnce(async () => {
            return new Promise((resolve) => {
              setTimeout(() => resolve(false), 200);
            });
          }),
        initialValues: { a: 5 },
        initialIsValidating: false,
      };

      const tk = new FormToolkit(opt);
      tk.validate();
      tk.validate();
      const lastCall = tk.validate();

      await lastCall;

      expect(opt.validate).toHaveBeenCalledTimes(1);
    });
  });

  describe("state.isValid", () => {
    it("should start as true by default", () => {
      const tk = new FormToolkit();
      expect(tk.getState().isValid).toBe(true);
    });

    it("should start as false if initialIsValid=false", () => {
      const tk = new FormToolkit({ initialIsValid: false });
      expect(tk.getState().isValid).toBe(false);
    });

    it("should remain false if isInvalid=false and valdate not supplied", async () => {
      const tk = new FormToolkit({ initialIsValid: false });
      await waitForExpression(() => tk.getState().isValidating, false);
      expect(tk.getState().isValid).toBe(false);
    });

    it("should change to false if validate returns false", async () => {
      const tk = new FormToolkit({ validate: () => false });

      expect(tk.getState().isValid).toBe(true);
      await waitFor(() => expect(tk.getState().isValid).toBe(false));
    });

    it("should change to false after value changes and validate fn returns false", async () => {
      const tk = new FormToolkit({
        validate: jest
          .fn()
          .mockImplementationOnce(() => true)
          .mockImplementationOnce(() => false),
        initialValues: { a: 5 },
      });

      await waitForTime(VALIDATE_DEBOUNCE_TIME);

      tk.updateValues((values) => {
        values.a = 1000;
      });

      await waitFor(() => expect(tk.getState().isValid).toBe(false));
    });
  });
});

describe("dirty aspect", () => {
  it("should be false by default", async () => {
    const tk = new FormToolkit({
      initialValues: { a: 5 },
    });

    expect(tk.isFieldDirty("a")).toBe(false);
  });

  describe("leaf", () => {
    it("should become dirty if field changes", async () => {
      const tk = new FormToolkit({
        initialValues: { a: 5 },
      });

      tk.updateValues((draft) => {
        draft.a = 1000;
      });

      expect(tk.isFieldDirty("a")).toBe(true);
    });

    it("should become clean if field is restored to initial value", async () => {
      const tk = new FormToolkit({
        initialValues: { a: "5" },
      });

      tk.updateValues((draft) => {
        draft.a = "1000";
      });

      tk.updateValues((draft) => {
        draft.a = "5";
      });

      expect(tk.isFieldDirty("a")).toBe(false);
    });

    it("should be dirty if field path is new and triggers change", () => {
      type MyForm = { a?: { b: { c: number } } };

      const tk = new FormToolkit<MyForm>({
        initialValues: {},
      });

      tk.updateValues((draft) => {
        set(draft, tk.path("a.b.c"), 1000);
      });

      expect(tk.isFieldDirty("a.b.c")).toBe(true);
    });

    it("should become dirty if parent object value becomes undefined", async () => {
      type MyForm = { a?: { b: number } };

      const tk = new FormToolkit<MyForm>({
        initialValues: { a: { b: 5 } },
      });

      tk.updateValues((draft) => {
        draft.a = undefined;
      });

      expect(tk.isFieldDirty("a.b")).toBe(true);
    });

    it("should become dirty if parent array value becomes undefined", async () => {
      type MyForm = { a?: string[] };

      const tk = new FormToolkit<MyForm>({
        initialValues: { a: ["5"] },
      });

      tk.updateValues((draft) => {
        draft.a = undefined;
      });

      expect(tk.isFieldDirty("a.0")).toBe(true);
    });

    it("should become dirty if array prev sibling is deleted", async () => {
      type MyForm = { a?: string[] };

      const tk = new FormToolkit<MyForm>({
        initialValues: { a: ["1", "2"] },
      });

      tk.updateValues((draft) => {
        draft.a = ["2"];
      });

      expect(tk.isFieldDirty("a.1")).toBe(true);
    });
  });

  describe("object", () => {
    it("should become dirty if property changes", () => {
      const tk = new FormToolkit({
        initialValues: {
          value: { nestedValue: 5 },
        },
      });

      tk.updateValues((draft) => {
        draft.value.nestedValue = 1000;
      });

      expect(tk.isFieldDirty("value")).toBe(true);
    });

    it("should become clean if property is restored to initial value", () => {
      const tk = new FormToolkit({
        initialValues: {
          value: { nestedValue: "5" },
        },
      });

      tk.updateValues((draft) => {
        draft.value.nestedValue = "1000";
      });

      tk.updateValues((draft) => {
        draft.value.nestedValue = "5";
      });

      expect(tk.isFieldDirty("value")).toBe(false);
    });

    it("should remain dirty if only some properties are restored to initial value", () => {
      const tk = new FormToolkit({
        initialValues: {
          value: { nestedValue: "5", nestedValue2: "5" },
        },
      });

      tk.updateValues((draft) => {
        draft.value.nestedValue = "1000";
        draft.value.nestedValue2 = "1000";
      });

      tk.updateValues((draft) => {
        draft.value.nestedValue = "5";
      });

      expect(tk.isFieldDirty("value")).toBe(true);
    });

    it("should start dirty if setting a property value of a non existing path", () => {
      type MyForm = { a?: { b: { c: number } } };

      const tk = new FormToolkit<MyForm>({ initialValues: {} });

      tk.updateValues((draft) => {
        set(draft, tk.path("a.b.c"), 1000);
      });

      expect(tk.isFieldDirty("a")).toBe(true);
    });

    it("should become dirty if property is deleted - using delete", () => {
      type MyForm = { a: { toBeDeleted?: number } };

      const tk = new FormToolkit<MyForm>({
        initialValues: {
          a: { toBeDeleted: 1 },
        },
      });

      tk.updateValues((draft) => {
        delete draft.a.toBeDeleted;
      });

      expect(tk.isFieldDirty("a")).toBe(true);
    });

    it("should become dirty if property is deleted - using undefined assignment", () => {
      type MyForm = { a: { toBeDeleted?: number } };

      const tk = new FormToolkit<MyForm>({
        initialValues: {
          a: { toBeDeleted: 1 },
        },
      });

      tk.updateValues((draft) => {
        draft.a.toBeDeleted = undefined;
      });

      expect(tk.isFieldDirty("a")).toBe(true);
    });
  });

  describe("array", () => {
    it("should become dirty if item changes", () => {
      const tk = new FormToolkit({
        initialValues: {
          value: ["5"],
        },
      });

      tk.updateValues((draft) => {
        draft.value[0] = "1000";
      });

      expect(tk.isFieldDirty("value")).toBe(true);
    });

    it("should become clean if item is restored to initial value", () => {
      const tk = new FormToolkit({
        initialValues: {
          value: ["5"],
        },
      });

      tk.updateValues((draft) => {
        draft.value[0] = "1000";
      });

      tk.updateValues((draft) => {
        draft.value[0] = "5";
      });

      expect(tk.isFieldDirty("value")).toBe(false);
    });

    it("should remain dirty if only some items are restored to initial value", () => {
      const tk = new FormToolkit({
        initialValues: {
          value: ["5", "5"],
        },
      });

      tk.updateValues((draft) => {
        draft.value[0] = "1000";
        draft.value[1] = "1000";
      });

      tk.updateValues((draft) => {
        draft.value[0] = "5";
      });

      expect(tk.isFieldDirty("value")).toBe(true);
    });

    it("should start dirty if setting an item value of a non existing path", () => {
      type MyForm = { a?: Array<{ b: number }> };

      const tk = new FormToolkit<MyForm>({ initialValues: {} });

      tk.updateValues((draft) => {
        set(draft, tk.path("a.0"), { b: 5 });
      });

      expect(tk.isFieldDirty("a")).toBe(true);
    });

    it("should become dirty if item is deleted - using splice", () => {
      const tk = new FormToolkit({
        initialValues: {
          a: [{ b: 1 }, { b: 2 }],
        },
      });

      tk.updateValues((arg) => {
        arg.a.splice(0, 1);
      });

      expect(tk.isFieldDirty("a")).toBe(true);
    });

    it("should become dirty if item is deleted - using assignment", () => {
      const tk = new FormToolkit({
        initialValues: {
          a: [{ b: 1 }, { b: 2 }],
        },
      });

      tk.updateValues((arg) => {
        arg.a = arg.a.filter((_, i) => i !== 0);
      });

      expect(tk.isFieldDirty("a")).toBe(true);
    });
  });
});

describe("subscribers", () => {
  describe("subscribe", () => {
    it("should accept a function that will be called once toolkit state changes", () => {
      const tk = new FormToolkit({ initialValues: { x: 5 } });
      const subscriber = jest.fn();
      tk.subscribe(subscriber);

      tk.updateValues((draft) => {
        draft.x = 1000;
      });

      expect(subscriber).toHaveBeenCalledWith(tk.getState());
    });

    it("should return unsubscribe fn", () => {
      const tk = new FormToolkit({ initialValues: { x: 5 } });
      const subscriber = jest.fn();
      const unsubscribe = tk.subscribe(subscriber);

      unsubscribe();

      tk.updateValues((draft) => {
        draft.x = 1000;
      });

      expect(subscriber).not.toHaveBeenCalled();
    });

    it("should work with multiple subscribers", () => {
      const tk = new FormToolkit({ initialValues: { x: 5 } });
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      tk.subscribe(subscriber1);
      tk.subscribe(subscriber2);

      tk.updateValues((draft) => {
        draft.x = 1000;
      });

      expect(subscriber1).toHaveBeenCalledWith(tk.getState());
      expect(subscriber2).toHaveBeenCalledWith(tk.getState());
    });
  });
});
