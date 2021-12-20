import React from "react";
import { Meta, Story } from "@storybook/react";
import { FormProvider } from "src/lib/FormProvider";

export default {
  title: "Example/FormProvider",
  component: FormProvider,
} as Meta;

const Template: Story<{}> = (args) => <FormProvider {...args} />;

export const Provider = Template.bind({});
Provider.args = {};
