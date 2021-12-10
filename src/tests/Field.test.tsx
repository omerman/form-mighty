import { render } from "@testing-library/react";
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

  expect(container.querySelector("code")).toHaveTextContent("5");
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

    expect(container.querySelector("code")).toHaveTextContent("true");
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

    expect(container.querySelector("code")).toHaveTextContent("1000");
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

    expect(container.querySelector("input")).toHaveValue("Hello World");
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

    expect(container.querySelector("code")).toHaveTextContent("false");
  });

  describe("leaf", () => {
    it("should become dirty if field changes", async () => {
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

      expect(container.querySelector("code")).toHaveTextContent("true");
    });

    it("should become undirty if field is restored to initial value", async () => {
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

      userEvent.type(container.querySelector("input")!, "H");
      userEvent.clear(container.querySelector("input")!);

      expect(container.querySelector("span")).toHaveTextContent("false");
    });

    it("should be dirty if field is new", () => {
      type MyForm = { a?: { b: number } };

      const { container } = render(
        <FormProvider>
          <FormMighty<MyForm> initialValues={{}}>
            {(tk) => (
              <Field fieldPath={tk.path("a.b")}>
                {({ value, onChange }, _) => (
                  <div>
                    <code onClick={() => onChange(1000)} />
                    <span>
                      {String(tk.isFieldDirty("a.b"))} {value}
                    </span>
                  </div>
                )}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.click(container.querySelector("code")!);

      expect(container.querySelector("span")).toHaveTextContent("true");
    });

    it("should be dirty if parent object value becomes undefined", async () => {
      type MyForm = { a?: { b: number } };

      const { container } = render(
        <FormProvider>
          <FormMighty<MyForm> initialValues={{ a: { b: 5 } }}>
            {(tk) => (
              <Field fieldPath={tk.path("a")}>
                {({ value, onChange }, _) => (
                  <div>
                    <code onClick={() => onChange(undefined)} />
                    <span>{String(tk.isFieldDirty("a.b"))}</span>
                  </div>
                )}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.click(container.querySelector("code")!);

      expect(container.querySelector("span")).toHaveTextContent("true");
    });

    it("should be dirty if parent array value becomes undefined", async () => {
      type MyForm = { a?: string[] };

      const { container } = render(
        <FormProvider>
          <FormMighty<MyForm> initialValues={{ a: ["5"] }}>
            {(tk) => (
              <Field fieldPath={tk.path("a")}>
                {({ value, onChange }, _) => (
                  <div>
                    <code onClick={() => onChange(undefined)} />
                    <span>{String(tk.isFieldDirty("a.0"))}</span>
                  </div>
                )}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.click(container.querySelector("code")!);

      expect(container.querySelector("span")).toHaveTextContent("true");
    });
  });

  describe("parent object", () => {
    it("should become dirty if child's field changes", () => {
      const { container } = render(
        <FormProvider>
          <FormMighty initialValues={{ value: { nestedValue: 5 } }}>
            {(tk) => (
              <Field fieldPath={tk.path("value.nestedValue")}>
                {({ onChange }, _) => (
                  <code onClick={() => onChange(1000)}>
                    {String(tk.isFieldDirty("value"))}
                  </code>
                )}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.click(container.querySelector("code")!);

      expect(container.querySelector("code")).toHaveTextContent("true");
    });

    it("should become undirty if child's field is restored to initial value", () => {
      const { container } = render(
        <FormProvider>
          <FormMighty initialValues={{ value: { nestedValue: "" } }}>
            {(tk) => (
              <Field fieldPath={tk.path("value.nestedValue")}>
                {({ value, onChange }, _) => (
                  <div>
                    <input onChange={onChange} value={value} />
                    <span>{String(tk.isFieldDirty("value"))}</span>
                  </div>
                )}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.type(container.querySelector("input")!, "H");
      userEvent.clear(container.querySelector("input")!);

      expect(container.querySelector("span")).toHaveTextContent("false");
    });

    it("should remain dirty if only one child's field is restored to initial value", () => {
      const { container } = render(
        <FormProvider>
          <FormMighty
            initialValues={{ value: { nestedValue: "", nestedValue2: "" } }}
          >
            {(tk) => (
              <>
                <Field fieldPath={tk.path("value.nestedValue")}>
                  {({ value, onChange }, _) => (
                    <div>
                      <input id="input1" onChange={onChange} value={value} />
                      <span>{String(tk.isFieldDirty("value"))}</span>
                    </div>
                  )}
                </Field>
                <Field fieldPath={tk.path("value.nestedValue2")}>
                  {({ value, onChange }, _) => (
                    <div>
                      <input id="input2" onChange={onChange} value={value} />
                      <span>{String(tk.isFieldDirty("value"))}</span>
                    </div>
                  )}
                </Field>
              </>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.type(container.querySelector("#input1")!, "H");
      userEvent.type(container.querySelector("#input2")!, "H");

      userEvent.clear(container.querySelector("#input1")!);

      expect(container.querySelector("span")).toHaveTextContent("true");
    });

    it("should be dirty if child's field is new", () => {
      type MyForm = { a?: { b: number } };

      const { container } = render(
        <FormProvider>
          <FormMighty<MyForm> initialValues={{}}>
            {(tk) => (
              <Field fieldPath={tk.path("a.b")}>
                {({ value, onChange }, _) => (
                  <div>
                    <code onClick={() => onChange(1000)} />
                    <span>{String(tk.isFieldDirty("a"))}</span>
                  </div>
                )}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.click(container.querySelector("code")!);

      expect(container.querySelector("span")).toHaveTextContent("true");
    });
  });
});
