import React from "react";
import { FormProvider } from "../lib";
import { MyForm } from "./MyForm";

export const App: React.FC = () => {
  return (
    <FormProvider>
      <MyForm />
    </FormProvider>
  );
};
