import { render, RenderResult, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field } from "src/lib/Field";
import { FormMighty } from "src/lib/FormMighty";
import { FormProvider } from "src/lib/FormProvider";
import { FormToolkit } from "src/lib/FormToolkit";
import { waitForTime } from "./utils";

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

  expect(container.querySelector("code")).toHaveTextContent(/^Hi$/);
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

  expect(container.querySelector("code")).toHaveTextContent(/^5$/);
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

    expect(container.querySelector("code")).toHaveTextContent(/^true$/);
  });

  it("should support a plain(non Event) value as an argument", async () => {
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

    expect(container.querySelector("code")).toHaveTextContent(/^1000$/);
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
              {(_, { isDirty }) => <code>{String(isDirty)}</code>}
            </Field>
          )}
        </FormMighty>
      </FormProvider>
    );

    expect(container.querySelector("code")).toHaveTextContent(/^false$/);
  });

  describe("leaf", () => {
    it("should become dirty if field changes", async () => {
      const { container } = render(
        <FormProvider>
          <FormMighty initialValues={{ value: 5 }}>
            {(tk) => (
              <Field fieldPath={tk.path("value")}>
                {({ onChange }, { isDirty }) => (
                  <>
                    <code onClick={() => onChange(1000)} />
                    <span>{String(isDirty)}</span>
                  </>
                )}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.click(container.querySelector("code")!);

      expect(container.querySelector("span")).toHaveTextContent(/^true$/);
    });

    it("should become clean if field is restored to initial value", async () => {
      const { container } = render(
        <FormProvider>
          <FormMighty initialValues={{ value: "" }}>
            {(tk) => (
              <Field fieldPath={tk.path("value")}>
                {({ value, onChange }, { isDirty }) => (
                  <>
                    <input onChange={onChange} value={value} />
                    <span>{String(isDirty)}</span>
                  </>
                )}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.type(container.querySelector("input")!, "H");
      userEvent.clear(container.querySelector("input")!);

      expect(container.querySelector("span")).toHaveTextContent(/^false$/);
    });

    it("should start dirty if field path is new and triggers change", () => {
      type MyForm = { a?: { b: { c: number } } };

      const { container } = render(
        <FormProvider>
          <FormMighty<MyForm> initialValues={{}}>
            {(tk) => (
              <Field fieldPath={tk.path("a.b.c")}>
                {({ onChange }, { isDirty }) => (
                  <>
                    <code onClick={() => onChange(1000)} />
                    <span>{String(isDirty)}</span>
                  </>
                )}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.click(container.querySelector("code")!);

      expect(container.querySelector("span")).toHaveTextContent(/^true$/);
    });

    it("should become dirty if parent object value becomes undefined", async () => {
      type MyForm = { a?: { b: number } };

      const { container } = render(
        <FormProvider>
          <FormMighty<MyForm> initialValues={{ a: { b: 5 } }}>
            {(tk) => (
              <>
                <Field fieldPath={tk.path("a")}>
                  {({ onChange }) => (
                    <code onClick={() => onChange(undefined)} />
                  )}
                </Field>
                <Field fieldPath={tk.path("a.b")}>
                  {(_, { isDirty }) => <span>{String(isDirty)}</span>}
                </Field>
              </>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.click(container.querySelector("code")!);

      expect(container.querySelector("span")).toHaveTextContent(/^true$/);
    });

    it("should become dirty if parent array value becomes undefined", async () => {
      type MyForm = { a?: string[] };

      const { container } = render(
        <FormProvider>
          <FormMighty<MyForm> initialValues={{ a: ["5"] }}>
            {(tk) => (
              <Field fieldPath={tk.path("a")}>
                {({ onChange }) => (
                  <>
                    <code onClick={() => onChange(undefined)} />
                    <span>{String(tk.isFieldDirty("a.0"))}</span>
                  </>
                )}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.click(container.querySelector("code")!);

      expect(container.querySelector("span")).toHaveTextContent(/^true$/);
    });

    it("should become dirty if array prev sibling is deleted", async () => {
      type MyForm = { a?: string[] };

      const { container } = render(
        <FormProvider>
          <FormMighty<MyForm> initialValues={{ a: ["1", "2"] }}>
            {(tk) => (
              <>
                <Field fieldPath={tk.path("a")}>
                  {({ onChange }) => <code onClick={() => onChange(["2"])} />}
                </Field>
                <Field fieldPath={tk.path("a.1")}>
                  {(_, { isDirty }) => <span>{String(isDirty)}</span>}
                </Field>
              </>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.click(container.querySelector("code")!);

      expect(container.querySelector("span")).toHaveTextContent(/^true$/);
    });
  });

  describe("parent object", () => {
    it("should become dirty if child's field changes", () => {
      const { container } = render(
        <FormProvider>
          <FormMighty initialValues={{ value: { nestedValue: 5 } }}>
            {(tk) => (
              <>
                <Field fieldPath={tk.path("value.nestedValue")}>
                  {({ onChange }) => <code onClick={() => onChange(1000)} />}
                </Field>
                <Field fieldPath={tk.path("value.nestedValue")}>
                  {(_, { isDirty }) => <span>{String(isDirty)}</span>}
                </Field>
              </>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.click(container.querySelector("code")!);

      expect(container.querySelector("span")).toHaveTextContent(/^true$/);
    });

    it("should become clean if child's field is restored to initial value", () => {
      const { container } = render(
        <FormProvider>
          <FormMighty initialValues={{ value: { nestedValue: "" } }}>
            {(tk) => (
              <>
                <Field fieldPath={tk.path("value.nestedValue")}>
                  {({ onChange }) => <input onChange={onChange} />}
                </Field>
                <Field fieldPath={tk.path("value")}>
                  {(_, { isDirty }) => <span>{String(isDirty)}</span>}
                </Field>
              </>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.type(container.querySelector("input")!, "H");
      userEvent.clear(container.querySelector("input")!);

      expect(container.querySelector("span")).toHaveTextContent(/^false$/);
    });

    it("should start dirty if child's field path is new and triggers change", () => {
      type MyForm = { a?: { b: { c: number } } };

      const { container } = render(
        <FormProvider>
          <FormMighty<MyForm> initialValues={{}}>
            {(tk) => (
              <>
                <Field fieldPath={tk.path("a.b.c")}>
                  {({ onChange }) => <code onClick={() => onChange(1000)} />}
                </Field>
                <Field fieldPath={tk.path("a")}>
                  {(_, { isDirty }) => <span>{String(isDirty)}</span>}
                </Field>
              </>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.click(container.querySelector("code")!);

      expect(container.querySelector("span")).toHaveTextContent(/^true$/);
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
                  {({ onChange }) => <input id="input1" onChange={onChange} />}
                </Field>
                <Field fieldPath={tk.path("value.nestedValue2")}>
                  {({ onChange }) => <input id="input2" onChange={onChange} />}
                </Field>
                <Field fieldPath={tk.path("value")}>
                  {(_, { isDirty }) => <span>{String(isDirty)}</span>}
                </Field>
              </>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.type(container.querySelector("#input1")!, "H");
      userEvent.type(container.querySelector("#input2")!, "H");

      userEvent.clear(container.querySelector("#input1")!);

      expect(container.querySelector("span")).toHaveTextContent(/^true$/);
    });

    it("should be dirty if child's field is new", () => {
      type MyForm = { a?: { b: number } };

      const { container } = render(
        <FormProvider>
          <FormMighty<MyForm> initialValues={{}}>
            {(tk) => (
              <>
                <Field fieldPath={tk.path("a.b")}>
                  {({ onChange }) => <code onClick={() => onChange(1000)} />}
                </Field>
                <Field fieldPath={tk.path("a")}>
                  {(_, { isDirty }) => <span>{String(isDirty)}</span>}
                </Field>
              </>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.click(container.querySelector("code")!);

      expect(container.querySelector("span")).toHaveTextContent(/^true$/);
    });

    it("should become dirty if child is deleted - using delete", () => {
      const tk = new FormToolkit({
        initialValues: {
          a: {
            one: 1 as number | undefined,
            two: 2 as number | undefined,
          },
        },
      });

      const { container } = render(
        <FormProvider>
          <FormMighty toolkit={tk}>
            {(tk) => (
              <>
                <Field fieldPath={tk.path("a")}>
                  {(_, { isDirty }) => <span>{String(isDirty)}</span>}
                </Field>
              </>
            )}
          </FormMighty>
        </FormProvider>
      );

      tk.updateValues((arg) => {
        delete arg.a["one"];
      });

      expect(container.querySelector("span")).toHaveTextContent(/^true$/);
    });

    it("should become dirty if child is deleted - using assignment", () => {
      const tk = new FormToolkit({
        initialValues: {
          a: {
            one: 1 as number | undefined,
            two: 2 as number | undefined,
          },
        },
      });

      const { container } = render(
        <FormProvider>
          <FormMighty toolkit={tk}>
            {(tk) => (
              <>
                <Field fieldPath={tk.path("a")}>
                  {(_, { isDirty }) => <span>{String(isDirty)}</span>}
                </Field>
              </>
            )}
          </FormMighty>
        </FormProvider>
      );

      tk.updateValues((arg) => {
        arg.a.one = undefined;
      });

      expect(container.querySelector("span")).toHaveTextContent(/^true$/);
    });
  });

  describe("parent array", () => {
    it("should become dirty if child's field changes", () => {
      const { container } = render(
        <FormProvider>
          <FormMighty initialValues={{ value: ["5"] }}>
            {(tk) => (
              <>
                <Field fieldPath={tk.path("value.0")}>
                  {({ onChange }) => <code onClick={() => onChange("1000")} />}
                </Field>
                <Field fieldPath={tk.path("value")}>
                  {(_, { isDirty }) => <span>{String(isDirty)}</span>}
                </Field>
              </>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.click(container.querySelector("code")!);

      expect(container.querySelector("span")).toHaveTextContent(/^true$/);
    });

    it("should become clean if child's field is restored to initial value", () => {
      const { container } = render(
        <FormProvider>
          <FormMighty initialValues={{ value: [""] }}>
            {(tk) => (
              <>
                <Field fieldPath={tk.path("value.0")}>
                  {({ onChange }) => <input onChange={onChange} />}
                </Field>
                <Field fieldPath={tk.path("value")}>
                  {(_, { isDirty }) => <span>{String(isDirty)}</span>}
                </Field>
              </>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.type(container.querySelector("input")!, "H");
      userEvent.clear(container.querySelector("input")!);

      expect(container.querySelector("span")).toHaveTextContent(/^false$/);
    });

    it("should start dirty if child's field path is new and triggers change", () => {
      type MyForm = { a?: Array<{ b: number }> };

      const { container } = render(
        <FormProvider>
          <FormMighty<MyForm> initialValues={{}}>
            {(tk) => (
              <>
                <Field fieldPath={tk.path("a.0.b")}>
                  {({ onChange }) => <code onClick={() => onChange(1000)} />}
                </Field>
                <Field fieldPath={tk.path("a")}>
                  {(_, { isDirty }) => <span>{String(isDirty)}</span>}
                </Field>
              </>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.click(container.querySelector("code")!);

      expect(container.querySelector("span")).toHaveTextContent(/^true$/);
    });

    it("should remain dirty if only one child's field is restored to initial value", () => {
      const { container } = render(
        <FormProvider>
          <FormMighty initialValues={{ value: ["", ""] }}>
            {(tk) => (
              <>
                <Field fieldPath={tk.path("value.0")}>
                  {({ onChange }) => <input id="input1" onChange={onChange} />}
                </Field>
                <Field fieldPath={tk.path("value.1")}>
                  {({ onChange }) => <input id="input2" onChange={onChange} />}
                </Field>
                <Field fieldPath={tk.path("value")}>
                  {(_, { isDirty }) => <span>{String(isDirty)}</span>}
                </Field>
              </>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.type(container.querySelector("#input1")!, "H");
      userEvent.type(container.querySelector("#input2")!, "H");

      userEvent.clear(container.querySelector("#input1")!);

      expect(container.querySelector("span")).toHaveTextContent(/^true$/);
    });

    it("should become dirty if child is deleted - using splice", () => {
      const tk = new FormToolkit({
        initialValues: {
          a: [{ b: 1 }, { b: 2 }],
        },
      });

      const { container } = render(
        <FormProvider>
          <FormMighty toolkit={tk}>
            {(tk) => (
              <>
                <Field fieldPath={tk.path("a")}>
                  {(_, { isDirty }) => <span>{String(isDirty)}</span>}
                </Field>
              </>
            )}
          </FormMighty>
        </FormProvider>
      );

      tk.updateValues((arg) => {
        arg.a.splice(0, 1);
      });

      expect(container.querySelector("span")).toHaveTextContent(/^true$/);
    });

    it("should become dirty if child is deleted - using assignment", () => {
      const tk = new FormToolkit({
        initialValues: {
          a: [{ b: 1 }, { b: 2 }],
        },
      });

      const { container } = render(
        <FormProvider>
          <FormMighty toolkit={tk}>
            {(tk) => (
              <>
                <Field fieldPath={tk.path("a")}>
                  {(_, { isDirty }) => <span>{String(isDirty)}</span>}
                </Field>
              </>
            )}
          </FormMighty>
        </FormProvider>
      );

      tk.updateValues((arg) => {
        arg.a = arg.a.filter((_, i) => i !== 0);
      });

      expect(container.querySelector("span")).toHaveTextContent(/^true$/);
    });
  });
});

describe("validation aspect", () => {
  describe("validate prop", () => {
    it("should be called uppon render with value as first arg", async () => {
      const validate = jest.fn(() => false);

      render(
        <FormProvider>
          <FormMighty initialValues={{ field1: 5 }}>
            {(tk) => (
              <Field fieldPath={tk.path("field1")} validate={validate}>
                {() => null}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
      );

      expect(validate).toHaveBeenCalledWith(5);
    });

    it("should not be called again if validate fn changes", async () => {
      const validate = jest.fn(() => false);

      const { rerender } = render(
        <FormProvider>
          <FormMighty initialValues={{ field1: 5 }}>
            {(tk) => (
              <Field fieldPath={tk.path("field1")} validate={validate}>
                {() => null}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
      );

      rerender(
        <FormProvider>
          <FormMighty initialValues={{ field1: 5 }}>
            {(tk) => (
              <Field fieldPath={tk.path("field1")} validate={() => validate()}>
                {() => null}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
      );

      expect(validate).toHaveBeenCalledTimes(1);
    });

    it("should be called after changing the field value", async () => {
      const validate = jest.fn(() => false);

      const { container } = render(
        <FormProvider>
          <FormMighty initialValues={{ field1: 5 }}>
            {(tk) => (
              <Field fieldPath={tk.path("field1")} validate={validate}>
                {({ onChange }) => (
                  <code onClick={() => onChange(1000)}>{null}</code>
                )}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
      );

      userEvent.click(container.querySelector("code")!);

      expect(validate).toHaveBeenCalledTimes(2);
    });
  });

  describe("valid indicator", () => {
    it("should be supplied while rendering children", async () => {
      const { container } = render(
        <FormProvider>
          <FormMighty>
            {(tk) => (
              <Field fieldPath="">
                {(_, { isValid }) => (
                  <code>{String(isValid !== undefined)}</code>
                )}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
      );

      expect(container.querySelector("code")).toHaveTextContent(/^true$/);
    });

    it("should be true when validate prop is missing", async () => {
      const { container } = render(
        <FormProvider>
          <FormMighty>
            {(tk) => (
              <Field fieldPath="">
                {(_, { isValid }) => <code>{String(isValid)}</code>}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
      );

      expect(container.querySelector("code")).toHaveTextContent(/^true$/);
    });

    it("should be true at first render even if validate prop returns false", async () => {
      act(() => {
        const { container } = render(
          <FormProvider>
            <FormMighty>
              {(tk) => (
                <Field fieldPath="" validate={() => false}>
                  {(_, { isValid }) => <code>{String(isValid)}</code>}
                </Field>
              )}
            </FormMighty>
          </FormProvider>
        );

        expect(container.querySelector("code")).toHaveTextContent(/^true$/);
      });
    });

    it("should be false after second render if validate prop returns false", async () => {
      const { container } = render(
        <FormProvider>
          <FormMighty>
            {(tk) => (
              <Field fieldPath="" validate={() => false}>
                {(_, { isValid }) => <code>{String(isValid)}</code>}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
      );

      expect(container.querySelector("code")).toHaveTextContent(/^false$/);
    });

    it("should reflect validate method result changes", async () => {
      const validateFn = jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const { container } = render(
        <FormProvider>
          <FormMighty initialValues={{ a: 5 }}>
            {(tk) => (
              <Field fieldPath={tk.path("a")} validate={validateFn}>
                {({ onChange }, { isValid }) => (
                  <code onClick={() => onChange(1000)}>{String(isValid)}</code>
                )}
              </Field>
            )}
          </FormMighty>
        </FormProvider>
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
          <FormProvider>
            <FormMighty initialValues={{ a: 5 }}>
              {(tk) => (
                <Field fieldPath={tk.path("a")} validate={validateFn}>
                  {({ onChange }, { isValid }) => (
                    <code onClick={() => onChange(1000)}>
                      {String(isValid)}
                    </code>
                  )}
                </Field>
              )}
            </FormMighty>
          </FormProvider>
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
          <FormProvider>
            <FormMighty initialValues={{ a: 5 }}>
              {(tk) => (
                <Field fieldPath={tk.path("a")} validate={validateFn}>
                  {({ onChange }, { isValid }) => (
                    <code onClick={() => onChange(1000)}>
                      {String(isValid)}
                    </code>
                  )}
                </Field>
              )}
            </FormMighty>
          </FormProvider>
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
