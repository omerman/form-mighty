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
