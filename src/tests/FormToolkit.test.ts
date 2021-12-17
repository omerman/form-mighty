import { FormToolkit } from "src/lib/FormToolkit";

it("Should work with no args", () => {
  new FormToolkit();
});

it("Should work with empty args", () => {
  new FormToolkit({});
});
