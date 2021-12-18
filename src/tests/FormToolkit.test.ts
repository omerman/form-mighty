import { waitFor } from "@testing-library/react";
import { set } from "lodash";
import { FormToolkitOptions } from "src/lib";
import { FormToolkit } from "src/lib/FormToolkit";
import { store } from "src/lib/redux/store";
import { waitForTime } from "./utils";

it("Should work with no args", () => {
  new FormToolkit();
});

it("Should work with empty args", () => {
  new FormToolkit({});
});

it("Should be stored by formKey uppon creation", () => {
  const tk = new FormToolkit();
  expect(store.getState()[tk.formKey]).toBe(tk.getState());
});

it("Should be disposed from store uppon disposal", () => {
  const tk = new FormToolkit();
  tk.dispose();
  expect(store.getState()[tk.formKey]).not.toBeDefined();
});

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

  it("should be bound to the class instace", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const opts: FormToolkitOptions = {
      onSubmit: jest.fn(),
      initialIsValid: true,
      validate: () => false,
    };

    const { submit } = new FormToolkit(opts);

    await expect(submit()).resolves.not.toThrow();

    consoleSpy.mockRestore();
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

  describe("parent object", () => {
    it("should become dirty if child's field changes", () => {
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

    it("should become clean if child's field is restored to initial value", () => {
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

    it("should remain dirty if only one child's field is restored to initial value", () => {
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

    it("should start dirty if child is new and parent didnt exist as well", () => {
      type MyForm = { a?: { b: { c: number } } };

      const tk = new FormToolkit<MyForm>({ initialValues: {} });

      tk.updateValues((draft) => {
        set(draft, tk.path("a.b.c"), 1000);
      });

      expect(tk.isFieldDirty("a")).toBe(true);
    });

    it("should become dirty if child is deleted - using delete", () => {
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

    it("should become dirty if child is deleted - using undefined assignment", () => {
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

  describe("parent array", () => {
    it("should become dirty if child's field changes", () => {
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

    it("should become clean if child's field is restored to initial value", () => {
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

    it("should remain dirty if only one child's field is restored to initial value", () => {
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

    it("should start dirty if child is new and parent didnt exist as well", () => {
      type MyForm = { a?: Array<{ b: number }> };

      const tk = new FormToolkit<MyForm>({ initialValues: {} });

      tk.updateValues((draft) => {
        set(draft, tk.path("a.0"), { b: 5 });
      });

      expect(tk.isFieldDirty("a")).toBe(true);
    });

    it("should become dirty if child is deleted - using splice", () => {
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

    it("should become dirty if child is deleted - using assignment", () => {
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
