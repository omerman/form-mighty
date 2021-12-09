import { render, waitFor } from "@testing-library/react";
import { FormProvider, FormState, FormSubscriber } from "src/lib";
import { FormMighty } from "src/lib/FormMighty";

it("should render", () => {
  render(
    <FormProvider>
      <FormMighty>{() => null}</FormMighty>
    </FormProvider>
  );
});

it("should throw if no children & no component prop supplied", () => {
  const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

  expect(() =>
    render(
      <FormProvider>
        <FormMighty />
      </FormProvider>
    )
  ).toThrow();

  consoleSpy.mockRestore();
});

describe("formToolkit", () => {
  it("should be supplied while rendering children", () => {
    const { container } = render(
      <FormProvider>
        <FormMighty>
          {(tk) => <code>{String(tk !== undefined)}</code>}
        </FormMighty>
      </FormProvider>
    );

    expect(container.querySelector("code")).toHaveTextContent("true");
  });

  it("should be instantiated with given initialValues", () => {
    const initialValues = { a: 5 };
    const { container } = render(
      <FormProvider>
        <FormMighty initialValues={initialValues}>
          {(tk) => <code>{JSON.stringify(tk.getState().initialValues)}</code>}
        </FormMighty>
      </FormProvider>
    );

    expect(container.querySelector("code")).toHaveTextContent(
      JSON.stringify(initialValues)
    );
  });

  it("should be instantiated with given initialIsValidating", () => {
    const { container } = render(
      <FormProvider>
        <FormMighty initialIsValidating={false}>
          {(tk) => <code>{String(tk.getState().isValidating)}</code>}
        </FormMighty>
      </FormProvider>
    );

    expect(container.querySelector("code")).toHaveTextContent("false");
  });

  it("should be instantiated with given initialIsValid", () => {
    const { container } = render(
      <FormProvider>
        <FormMighty initialIsValid={false}>
          {(tk) => <code>{String(tk.getState().isValid)}</code>}
        </FormMighty>
      </FormProvider>
    );

    expect(container.querySelector("code")).toHaveTextContent("false");
  });

  it("should be instantiated with given validate", async () => {
    const { container } = render(
      <FormProvider>
        <FormMighty initialIsValid={true} validate={() => false}>
          <FormSubscriber subscription={(fs: FormState) => fs.isValid}>
            {(isValid) => <code>{String(isValid)}</code>}
          </FormSubscriber>
        </FormMighty>
      </FormProvider>
    );

    await waitFor(() =>
      expect(container.querySelector("code")).toHaveTextContent("false")
    );
  });
});
