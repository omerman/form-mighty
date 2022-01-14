import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { FormMighty } from "src/lib/FormMighty";
import { Field, useFormSelector } from "src/lib";

export default {
  title: "Examples/Field",
  component: Field,
} as ComponentMeta<typeof Field>;

const FormStateViewer: React.FC<{}> = () => {
  const state = useFormSelector<any>();
  return (
    <code style={{ padding: "0 12px" }}>{JSON.stringify(state.values)}</code>
  );
};

export const SimpleField: ComponentStory<typeof Field> = () => (
  <FormMighty initialValues={{ name: "Omer", phone: "0123456789" }}>
    {(tk) => (
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <Field fieldPath={tk.path("name")}>
          {(descriptor) => <input {...descriptor} />}
        </Field>
        <FormStateViewer />
      </div>
    )}
  </FormMighty>
);
