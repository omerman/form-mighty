import React from "react";
import { Meta, Story } from "@storybook/react";
import { FormMighty } from "src/lib/FormMighty";

export default {
  title: "Example/FormMighty",
  component: FormMighty,
} as Meta;

const Template: Story<{}> = (args) => (
  <FormMighty {...args}>
    <div />
  </FormMighty>
);

export const Provider = Template.bind({});
Provider.args = {};
