import { render, waitFor } from "@testing-library/react";
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
      <FormMighty initialValues={{ omer: 5 }}>
        {(tk) => <Field fieldPath={tk.path("omer")}>{(value) => <code>{value}</code>}</Field>}
      </FormMighty>
    </FormProvider>
  );

  await waitFor(() => container.querySelector("code"));

  expect(container.querySelector("code")?.textContent).toBe("5");
});
