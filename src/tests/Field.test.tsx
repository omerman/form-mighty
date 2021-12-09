import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field } from "src/lib/Field";
import { FormMighty } from "src/lib/FormMighty";
import { FormProvider } from "src/lib/FormProvider";

it("should render", () => {
  render(
    <FormProvider>
      <FormMighty initialValues={{}}>
        <Field fieldPath="">{() => <code>Hi</code>}</Field>
      </FormMighty>
    </FormProvider>
  );
});

it("should render children", async () => {
  const { container } = render(
    <FormProvider>
      <FormMighty initialValues={{}}>
        <Field fieldPath="">{() => <code>Hi</code>}</Field>
      </FormMighty>
    </FormProvider>
  );

  expect(container.querySelector("code")).toHaveTextContent("Hi");
});

it("should accept fieldPath", async () => {
  render(
    <FormProvider>
      <FormMighty initialValues={{}}>
        <Field fieldPath={"a.b"}>{() => <code>Hi</code>}</Field>
      </FormMighty>
    </FormProvider>
  );
});

it("should render field value matching the given path", async () => {
  const { container } = render(
    <FormProvider>
      <FormMighty initialValues={{ value: 5 }}>
        {(tk) => (
          <Field fieldPath={tk.path("value")}>
            {({ value }) => <code>{value}</code>}
          </Field>
        )}
      </FormMighty>
    </FormProvider>
  );

  expect(container.querySelector("code")!.textContent).toBe("5");
});

describe("onChange", () => {
  it("should be supplied while rendering children", async () => {
    const { container } = render(
      <FormProvider>
        <FormMighty>
          {(tk) => (
            <Field fieldPath="">
              {({ onChange }) => <code>{String(onChange !== undefined)}</code>}
            </Field>
          )}
        </FormMighty>
      </FormProvider>
    );

    expect(container.querySelector("code")!.textContent).toBe("true");
  });

  it("should support raw value as an argument", async () => {
    const { container } = render(
      <FormProvider>
        <FormMighty initialValues={{ value: 5 }}>
          {(tk) => (
            <Field fieldPath={tk.path("value")}>
              {({ value, onChange }) => (
                <code onClick={() => onChange(1000)}>{value}</code>
              )}
            </Field>
          )}
        </FormMighty>
      </FormProvider>
    );

    userEvent.click(container.querySelector("code")!);

    expect(container.querySelector("code")!.textContent).toBe("1000");
  });

  it("should support HTMLInput event as an argument", async () => {
    const { container } = render(
      <FormProvider>
        <FormMighty initialValues={{ value: "" }}>
          {(tk) => (
            <Field fieldPath={tk.path("value")}>
              {({ value, onChange }) => (
                <input onChange={onChange} value={value} />
              )}
            </Field>
          )}
        </FormMighty>
      </FormProvider>
    );

    userEvent.type(container.querySelector("input")!, "Hello World");

    expect(container.querySelector("input")!.value).toBe("Hello World");
  });
});

describe("dirty indicator", () => {
  it("should be supplied (and false) when first rendering", async () => {
    const { container } = render(
      <FormProvider>
        <FormMighty>
          {(tk) => (
            <Field fieldPath="">
              {(_, isDirty) => <code>{String(isDirty)}</code>}
            </Field>
          )}
        </FormMighty>
      </FormProvider>
    );

    expect(container.querySelector("code")!.textContent).toBe("false");
  });

  it("should change after value changes", async () => {
    const { container } = render(
      <FormProvider>
        <FormMighty initialValues={{ value: 5 }}>
          {(tk) => (
            <Field fieldPath={tk.path("value")}>
              {({ onChange }, isDirty) => (
                <code onClick={() => onChange(1000)}>{String(isDirty)}</code>
              )}
            </Field>
          )}
        </FormMighty>
      </FormProvider>
    );

    userEvent.click(container.querySelector("code")!);

    expect(container.querySelector("code")!.textContent).toBe("true");
  });

  it("should change back after value becomes original", async () => {
    const { container } = render(
      <FormProvider>
        <FormMighty initialValues={{ value: "" }}>
          {(tk) => (
            <Field fieldPath={tk.path("value")}>
              {({ value, onChange }, isDirty) => (
                <div>
                  <input onChange={onChange} value={value} />
                  <span>{String(isDirty)}</span>
                </div>
              )}
            </Field>
          )}
        </FormMighty>
      </FormProvider>
    );

    userEvent.type(container.querySelector("input")!, "Hello World");
    userEvent.clear(container.querySelector("input")!);

    expect(container.querySelector("span")!.textContent).toBe("false");
  });
});
