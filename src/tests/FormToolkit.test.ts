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
