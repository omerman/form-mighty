import { render, RenderResult, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field } from "src/lib/Field";
import { FormMighty } from "src/lib/FormMighty";
import { FormToolkit } from "src/lib/FormToolkit";
import { waitForTime } from "./utils";

it("should render", () => {
  render(
    <FormMighty initialValues={{}}>
      <Field fieldPath="">{({ value, onChange }) => <code>Hi</code>}</Field>
    </FormMighty>
  );
});

it("should render children", async () => {
  const { container } = render(
    <FormMighty initialValues={{}}>
      <Field fieldPath="">{() => <code>Hi</code>}</Field>
    </FormMighty>
  );

  expect(container.querySelector("code")).toHaveTextContent(/^Hi$/);
});

it("should accept fieldPath", async () => {
  render(
    <FormMighty initialValues={{}}>
      <Field fieldPath={"a.b"}>{() => <code>Hi</code>}</Field>
    </FormMighty>
  );
});

it("should render field value matching the given path", async () => {
  const { container } = render(
    <FormMighty initialValues={{ value: 5 }}>
      {(tk) => (
        <Field fieldPath={tk.path("value")}>
          {({ value, onChange }) => <code>{value}</code>}
        </Field>
      )}
    </FormMighty>
  );

  expect(container.querySelector("code")).toHaveTextContent(/^5$/);
});

describe("onChange", () => {
  it("should be supplied while rendering children", async () => {
    const { container } = render(
      <FormMighty>
        {(tk) => (
          <Field fieldPath="">
            {({ onChange }) => <code>{String(onChange !== undefined)}</code>}
          </Field>
        )}
      </FormMighty>
    );

    expect(container.querySelector("code")).toHaveTextContent(/^true$/);
  });

  it("should support a plain(non Event) value as an argument", async () => {
    const { container } = render(
      <FormMighty initialValues={{ value: 5 }}>
        {(tk) => (
          <Field fieldPath={tk.path("value")}>
            {({ value, onChange }) => (
              <code onClick={() => onChange(1000)}>{value}</code>
            )}
          </Field>
        )}
      </FormMighty>
    );

    userEvent.click(container.querySelector("code")!);

    expect(container.querySelector("code")).toHaveTextContent(/^1000$/);
  });

  it("should support HTMLInput event as an argument", async () => {
    const { container } = render(
      <FormMighty initialValues={{ value: "" }}>
        {(tk) => (
          <Field fieldPath={tk.path("value")}>
            {({ value, onChange }) => (
              <input onChange={onChange} value={value} />
            )}
          </Field>
        )}
      </FormMighty>
    );

    userEvent.type(container.querySelector("input")!, "Hello World");

    expect(container.querySelector("input")).toHaveValue("Hello World");
  });
});

describe("isDirty", () => {
  it("should be supplied (and false) when first rendering", async () => {
    const { container } = render(
      <FormMighty>
        {(tk) => (
          <Field fieldPath="">
            {(_, { isDirty }) => <code>{String(isDirty)}</code>}
          </Field>
        )}
      </FormMighty>
    );

    expect(container.querySelector("code")).toHaveTextContent(/^false$/);
  });

  it("should change uppon onChange", async () => {
    const { container } = render(
      <FormMighty initialValues={{ value: 5 }}>
        {(tk) => (
          <Field fieldPath={tk.path("value")}>
            {({ onChange }, { isDirty }) => (
              <code onClick={() => onChange(1000)}>{String(isDirty)}</code>
            )}
          </Field>
        )}
      </FormMighty>
    );

    userEvent.click(container.querySelector("code")!);

    expect(container.querySelector("code")).toHaveTextContent(/^true$/);
  });

  it("should change uppon toolkit change", async () => {
    const tk = new FormToolkit({
      initialValues: { value: 5 },
    });

    const { container } = render(
      <FormMighty toolkit={tk}>
        {(tk) => (
          <Field fieldPath={tk.path("value")}>
            {(_, { isDirty }) => <code>{String(isDirty)}</code>}
          </Field>
        )}
      </FormMighty>
    );

    act(() => {
      tk.updateValues((draft) => {
        draft.value = 1000;
      });
    });

    expect(container.querySelector("code")).toHaveTextContent(/^true$/);
  });
});

describe("validation aspect", () => {
  describe("validate prop", () => {
    it("should be called uppon render with value as first arg", async () => {
      const validate = jest.fn(() => false);

      render(
        <FormMighty initialValues={{ field1: 5 }}>
          {(tk) => (
            <Field fieldPath={tk.path("field1")} validate={validate}>
              {() => null}
            </Field>
          )}
        </FormMighty>
      );

      expect(validate).toHaveBeenCalledWith(5);
    });

    it("should not be called again if validate fn changes", async () => {
      const validate = jest.fn(() => false);

      const { rerender } = render(
        <FormMighty initialValues={{ field1: 5 }}>
          {(tk) => (
            <Field fieldPath={tk.path("field1")} validate={validate}>
              {() => null}
            </Field>
          )}
        </FormMighty>
      );

      rerender(
        <FormMighty initialValues={{ field1: 5 }}>
          {(tk) => (
            <Field fieldPath={tk.path("field1")} validate={() => validate()}>
              {() => null}
            </Field>
          )}
        </FormMighty>
      );

      expect(validate).toHaveBeenCalledTimes(1);
    });

    it("should be called after changing the field value", async () => {
      const validate = jest.fn(() => false);

      const { container } = render(
        <FormMighty initialValues={{ field1: 5 }}>
          {(tk) => (
            <Field fieldPath={tk.path("field1")} validate={validate}>
              {({ onChange }) => (
                <code onClick={() => onChange(1000)}>{null}</code>
              )}
            </Field>
          )}
        </FormMighty>
      );

      act(() => {
        userEvent.click(container.querySelector("code")!);
      });

      expect(validate).toHaveBeenCalledTimes(2);
    });
  });

  describe("valid indicator", () => {
    it("should be supplied while rendering children", async () => {
      const { container } = render(
        <FormMighty>
          {(tk) => (
            <Field fieldPath="">
              {(_, { isValid }) => <code>{String(isValid !== undefined)}</code>}
            </Field>
          )}
        </FormMighty>
      );

      expect(container.querySelector("code")).toHaveTextContent(/^true$/);
    });

    it("should be true when validate prop is missing", async () => {
      const { container } = render(
        <FormMighty>
          {(tk) => (
            <Field fieldPath="">
              {(_, { isValid }) => <code>{String(isValid)}</code>}
            </Field>
          )}
        </FormMighty>
      );

      expect(container.querySelector("code")).toHaveTextContent(/^true$/);
    });

    it("should be true at first render even if validate prop returns false", async () => {
      act(() => {
        const { container } = render(
          <FormMighty>
            {(tk) => (
              <Field fieldPath="" validate={() => false}>
                {(_, { isValid }) => <code>{String(isValid)}</code>}
              </Field>
            )}
          </FormMighty>
        );

        expect(container.querySelector("code")).toHaveTextContent(/^true$/);
      });
    });

    it("should be false after second render if validate prop returns false", async () => {
      const { container } = render(
        <FormMighty>
          {(tk) => (
            <Field fieldPath="" validate={() => false}>
              {(_, { isValid }) => <code>{String(isValid)}</code>}
            </Field>
          )}
        </FormMighty>
      );

      expect(container.querySelector("code")).toHaveTextContent(/^false$/);
    });

    it("should reflect validate method result changes", async () => {
      const validateFn = jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const { container } = render(
        <FormMighty initialValues={{ a: 5 }}>
          {(tk) => (
            <Field fieldPath={tk.path("a")} validate={validateFn}>
              {({ onChange }, { isValid }) => (
                <code onClick={() => onChange(1000)}>{String(isValid)}</code>
              )}
            </Field>
          )}
        </FormMighty>
      );

      act(() => {
        userEvent.click(container.querySelector("code")!);

        // The validity change should take affect later.
        expect(container.querySelector("code")).toHaveTextContent(/^false$/);
      });

      expect(container.querySelector("code")).toHaveTextContent(/^true$/);
    });

    it("should reflect validate method result changes if validate is async", async () => {
      const validateFn = jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(true);
            }, 100);
          })
        );
      let renderResults: RenderResult;

      act(() => {
        renderResults = render(
          <FormMighty initialValues={{ a: 5 }}>
            {(tk) => (
              <Field fieldPath={tk.path("a")} validate={validateFn}>
                {({ onChange }, { isValid }) => (
                  <code onClick={() => onChange(1000)}>{String(isValid)}</code>
                )}
              </Field>
            )}
          </FormMighty>
        );
      });

      const { container } = renderResults!;

      userEvent.click(container.querySelector("code")!);

      expect(container.querySelector("code")).toHaveTextContent(/^false$/);

      await waitFor(() =>
        expect(container.querySelector("code")).toHaveTextContent(/^true$/)
      );
    });

    it("should get valid status based on last change", async () => {
      const FIRST_VALIDATE_DELAY_TIME = 100;

      const validateFn = jest
        .fn()
        .mockReturnValueOnce(
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(false);
            }, FIRST_VALIDATE_DELAY_TIME);
          })
        )
        .mockReturnValueOnce(true);
      let renderResults: RenderResult;

      act(() => {
        renderResults = render(
          <FormMighty initialValues={{ a: 5 }}>
            {(tk) => (
              <Field fieldPath={tk.path("a")} validate={validateFn}>
                {({ onChange }, { isValid }) => (
                  <code onClick={() => onChange(1000)}>{String(isValid)}</code>
                )}
              </Field>
            )}
          </FormMighty>
        );
      });

      const { container } = renderResults!;

      userEvent.click(container.querySelector("code")!);
      userEvent.click(container.querySelector("code")!);

      await waitForTime(FIRST_VALIDATE_DELAY_TIME + 1);

      expect(container.querySelector("code")).toHaveTextContent(/^true$/);
    });
  });
});
