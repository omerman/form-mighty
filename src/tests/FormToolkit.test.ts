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
  it("should call given onSubmit option", () => {
    const opts: FormToolkitOptions = {
      onSubmit: jest.fn(),
    };

    const tk = new FormToolkit(opts);

    tk.submit();
    expect(opts.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("should call given onSubmit option with values", () => {
    const opts: FormToolkitOptions = {
      onSubmit: jest.fn(),
      initialValues: { ok: 5 },
    };

    const tk = new FormToolkit(opts);

    tk.submit();
    expect(opts.onSubmit).toHaveBeenCalledWith(tk.getState().values);
  });

  it("should call given onSubmit option with values after changed", () => {
    const opts: FormToolkitOptions = {
      onSubmit: jest.fn(),
      initialValues: { ok: 5 },
    };

    const tk = new FormToolkit(opts);

    tk.updateValues((values) => {
      values.ok = 1000;
    });

    tk.submit();
    expect(opts.onSubmit).toHaveBeenCalledWith(tk.getState().values);
  });
});
