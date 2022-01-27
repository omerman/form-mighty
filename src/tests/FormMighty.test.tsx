import { render, waitFor } from "@testing-library/react";
import { FormState, FormSubscribtion } from "src/lib";
import { FormMighty } from "src/lib/FormMighty";
import { FormToolkit } from "src/lib/FormToolkit";
import { expectToThrow } from "./utils";

it("should render children", () => {
  render(<FormMighty>{() => null}</FormMighty>);
});

it("should render component", () => {
  const MySweetComponent = () => <code>Yey</code>;

  const { container } = render(<FormMighty component={MySweetComponent} />);

  expect(container.querySelector("code")).toHaveTextContent("Yey");
});

it("should throw if no children & no component prop supplied", () => {
  expectToThrow(() => render(<FormMighty />));
});

describe("formToolkit", () => {
  it("should be supplied while rendering children", () => {
    const { container } = render(
      <FormMighty>{(tk) => <code>{String(tk !== undefined)}</code>}</FormMighty>
    );

    expect(container.querySelector("code")).toHaveTextContent("true");
  });

  it("should be instantiated with given initialValues", () => {
    const initialValues = { a: 5 };
    const { container } = render(
      <FormMighty initialValues={initialValues}>
        {(tk) => <code>{JSON.stringify(tk.getState().initialValues)}</code>}
      </FormMighty>
    );

    expect(container.querySelector("code")).toHaveTextContent(
      JSON.stringify(initialValues)
    );
  });

  it("should be instantiated with given initialIsValidating", () => {
    const { container } = render(
      <FormMighty initialIsValidating={false}>
        {(tk) => <code>{String(tk.getState().isValidating)}</code>}
      </FormMighty>
    );

    expect(container.querySelector("code")).toHaveTextContent("false");
  });

  it("should be instantiated with given initialIsValid", () => {
    const { container } = render(
      <FormMighty initialIsValid={false}>
        {(tk) => <code>{String(tk.getState().isValid)}</code>}
      </FormMighty>
    );

    expect(container.querySelector("code")).toHaveTextContent("false");
  });

  it("should be instantiated with given validate", async () => {
    const { container } = render(
      <FormMighty initialIsValid={true} validate={() => false}>
        <FormSubscribtion selector={(fs: FormState) => fs.isValid}>
          {(isValid) => <code>{String(isValid)}</code>}
        </FormSubscribtion>
      </FormMighty>
    );

    await waitFor(() =>
      expect(container.querySelector("code")).toHaveTextContent("false")
    );
  });

  it("should be instantiated with given onSubmit", async () => {
    const onSubmit = jest.fn();
    let tk: FormToolkit<any>;

    render(
      <FormMighty onSubmit={onSubmit}>
        {(_tk) => {
          tk = _tk;
          return null;
        }}
      </FormMighty>
    );

    await tk!.submit();
    expect(onSubmit).toHaveBeenCalled();
  });

  it("may be overriden with custom toolkit", async () => {
    const toolkit = new FormToolkit({
      initialValues: { specialInitialValue: 5 },
    });

    const { container } = render(
      <FormMighty toolkit={toolkit}>
        {(tk) => <code>{JSON.stringify(tk.getState().initialValues)}</code>}
      </FormMighty>
    );

    await waitFor(() =>
      expect(container.querySelector("code")).toHaveTextContent(
        JSON.stringify(toolkit.getState().initialValues)
      )
    );
  });
});
