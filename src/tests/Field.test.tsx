import { render, waitFor, screen  } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field } from "src/lib/Field";
import { FormMighty } from "src/lib/FormMighty";
import { FormProvider } from "src/lib/FormProvider";

it("Should render", () => {
  render(
    <FormProvider>
      <FormMighty initialValues={{}}>
        <Field fieldPath="">{() => <code>Hi</code>}</Field>
      </FormMighty>
    </FormProvider>
  );
});

it("Should render children", async () => {
  const { container } = render(
    <FormProvider>
      <FormMighty initialValues={{}}>
        <Field fieldPath="">{() => <code>Hi</code>}</Field>
      </FormMighty>
    </FormProvider>
  );

  await waitFor(() => container.querySelector("code"));

  expect(container.querySelector("code")).toHaveTextContent("Hi");
});

it("Should accept fieldPath", async () => {
  render(
    <FormProvider>
      <FormMighty initialValues={{}}>
        <Field fieldPath={"a.b"}>{() => <code>Hi</code>}</Field>
      </FormMighty>
    </FormProvider>
  );
});

it("Should render field value matching the given path", async () => {
  const { container } = render(
    <FormProvider>
      <FormMighty initialValues={{ value: 5 }}>
        {(tk) => <Field fieldPath={tk.path("value")}>{({value}) => <code>{value}</code>}</Field>}
      </FormMighty>
    </FormProvider>
  );

  await waitFor(() => container.querySelector("code"));

  expect(container.querySelector("code")?.textContent).toBe("5");
});


it("Should supply onChange callback", async () => {
  const { container } = render(
    <FormProvider>
      <FormMighty>
        {(tk) => <Field fieldPath="">{({ onChange}) => <code>{String(onChange !== undefined)}</code>}</Field>}
      </FormMighty>
    </FormProvider>
  );

  await waitFor(() => container.querySelector("code"));

  expect(container.querySelector("code")?.textContent).toBe("true");
});

it("Should supply onChange callback that works when passing a field value", async () => {
  const { container } = render(
    <FormProvider>
      <FormMighty initialValues={{value: 5}} >
        {(tk) => <Field fieldPath={tk.path("value")}>{({ value, onChange}) => <code onClick={() => onChange(1000)} >{value}</code>}</Field>}
      </FormMighty>
    </FormProvider>
  );

  await waitFor(() => container.querySelector("code"));

  userEvent.click(container.querySelector("code")!);

  expect(container.querySelector("code")?.textContent).toBe("1000");
});

it("Should supply onChange callback that works with HTMLInput", async () => {
  const { container } = render(
    <FormProvider>
      <FormMighty initialValues={{value: ""}} >
        {(tk) => <Field fieldPath={tk.path("value")}>{({ value, onChange}) => <input onChange={onChange} value={value} />}</Field>}
      </FormMighty>
    </FormProvider>
  );

  await waitFor(() => container.querySelector("input"));

  userEvent.type(container.querySelector("input")!, "Hello World");

  expect(container.querySelector("input")?.value).toBe("Hello World");
});

it("Should include dirty indicator", async () => {
  const { container } = render(
    <FormProvider>
      <FormMighty>
        {(tk) => <Field fieldPath="">{( isDirty) => <code>{String(isDirty)}</code>}</Field>}
      </FormMighty>
    </FormProvider>
  );

  await waitFor(() => container.querySelector("code"));

  expect(container.querySelector("code")?.textContent).toBeTruthy();
});
