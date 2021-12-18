import { waitFor } from "@testing-library/react";
import { FormToolkitOptions } from "src/lib";
import { FormToolkit } from "src/lib/FormToolkit";
import { store } from "src/lib/redux/store";

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
  const waitForValidateDebounce = () => {
    const DEBOUNCE_TIME = 60;

    return waitFor(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(true), DEBOUNCE_TIME))
    );
  };

  describe("validate", () => {
    it("should be called uppon Instantioation, and async with initialValues", async () => {
      const opt: FormToolkitOptions = {
        validate: jest.fn().mockImplementation(() => true),
        initialValues: { a: 5 },
      };

      new FormToolkit(opt);

      expect(opt.validate).toHaveBeenCalledTimes(0);
      await waitFor(() => expect(opt.validate).toHaveBeenCalledTimes(1));
      expect(opt.validate).toHaveBeenCalledWith(opt.initialValues);
    });

    it("should not be called uppon Instantioation if initialIsValidating=false", async () => {
      const opt: FormToolkitOptions = {
        validate: jest.fn().mockImplementation(() => true),
        initialValues: { a: 5 },
        initialIsValidating: false,
      };

      new FormToolkit(opt);

      await waitFor(() => {
        return new Promise((resolve) => setTimeout(() => resolve(true), 100));
      });
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
      const opt: FormToolkitOptions = {
        validate: jest
          .fn()
          .mockImplementationOnce(async () => {
            return new Promise((resolve) => {
              setTimeout(() => resolve(false), 200);
            });
          })
          .mockImplementationOnce(() => false),
        initialValues: { a: 5 },
        initialIsValidating: false,
      };

      const tk = new FormToolkit(opt);

      tk.validate();

      await waitForValidateDebounce();

      tk.validate();

      await waitFor(() => expect(tk.getState().isValid).toBe(false), {
        timeout: 100,
      });
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

      await waitForValidateDebounce();

      tk.updateValues((values) => {
        values.a = 1000;
      });

      await waitFor(() => expect(tk.getState().isValid).toBe(false));
    });
  });
});