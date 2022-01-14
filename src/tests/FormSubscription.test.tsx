import { act, render } from "@testing-library/react";
import { FormMighty } from "src/lib/FormMighty";
import { FormState, FormSubscribtion } from "src/lib";
import { FormToolkit } from "src/lib/FormToolkit";

it("should render", () => {
  render(
    <FormMighty initialValues={{}}>
      <FormSubscribtion selector={() => ({})}>{() => null}</FormSubscribtion>
    </FormMighty>
  );
});

it("should throw if children not present", () => {
  const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

  expect(() =>
    render(
      <FormMighty initialValues={{}}>
        {/* @ts-ignore */}
        <FormSubscribtion selector={() => ({})} />
      </FormMighty>
    )
  ).toThrow();

  consoleSpy.mockRestore();
});

it("should pass subscription result uppon render children", () => {
  type MyForm = { field: number };
  const { container } = render(
    <FormMighty<MyForm> initialValues={{ field: 5 }}>
      <FormSubscribtion
        selector={(state: FormState<MyForm>) => ({
          res: state.values,
        })}
      >
        {({ res }) => <code>{res.field}</code>}
      </FormSubscribtion>
    </FormMighty>
  );

  expect(container.querySelector("code")).toHaveTextContent(/^5$/);
});

it("should re-render if subscription field is changed", () => {
  type MyForm = { field: number };
  const tk = new FormToolkit<MyForm>({
    initialValues: { field: 5 },
  });

  const { container } = render(
    <FormMighty toolkit={tk}>
      <FormSubscribtion
        selector={(state: FormState<MyForm>) => ({
          field: state.values.field,
        })}
      >
        {({ field }) => <code>{field}</code>}
      </FormSubscribtion>
    </FormMighty>
  );

  act(() => {
    tk.updateValues((draft) => {
      draft.field = 1000;
    });
  });

  expect(container.querySelector("code")).toHaveTextContent(/^1000$/);
});

it("should not re-render if subscription field is unchanged", () => {
  const renderChecker = jest
    .fn()
    .mockImplementationOnce(() => "Once")
    .mockImplementationOnce(() => "Twice");

  type MyForm = { field1: number; field2: number };
  const tk = new FormToolkit<MyForm>({
    initialValues: { field1: 5, field2: 5 },
  });

  const { container } = render(
    <FormMighty toolkit={tk}>
      <FormSubscribtion
        selector={(state: FormState<MyForm>) => ({
          field1: state.values.field1,
        })}
      >
        {() => (
          <>
            <code>{renderChecker()}</code>
          </>
        )}
      </FormSubscribtion>
    </FormMighty>
  );

  tk.updateValues((draft) => {
    draft.field2 = 1000;
  });

  expect(container.querySelector("code")).toHaveTextContent(/^Once$/);
});

it("should pass toolkit instance uppon render children as second argument", () => {
  const acceptFormToolkitFn = jest.fn();
  const tk = new FormToolkit();

  render(
    <FormMighty toolkit={tk}>
      <FormSubscribtion selector={() => null}>
        {(_, tk) => {
          acceptFormToolkitFn(tk);
          return null;
        }}
      </FormSubscribtion>
    </FormMighty>
  );

  expect(acceptFormToolkitFn).toHaveBeenCalledWith(tk);
});
