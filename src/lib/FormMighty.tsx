import React, { useRef } from "react";
import invariant from "invariant";
import { FormToolkit } from "./FormToolkit";
import { FormContextProvider } from "./context";
import { DefaultFormValues, FormToolkitOptions } from "./types";

export interface FormMightyProps<V extends DefaultFormValues>
  extends FormToolkitOptions<V> {
  toolkit?: FormToolkit<V>;
  component?: React.ComponentType<any>;
  children?:
    | React.ReactNode
    | ((toolkit: FormToolkit<V>) => React.ReactNode | React.ReactNode[]);
}

export const FormMighty = <V extends DefaultFormValues>({
  toolkit: givenToolkit,
  component: Component,
  children,
  ...toolkitOptions
}: FormMightyProps<V>): React.ReactElement<any, any> | null => {
  invariant(
    Component ?? children,
    "FormMighty - Must include one of [component, children] props"
  );

  // TODO - check if TS is better and try and remove the `as any` here ;)
  const toolkitRef: React.MutableRefObject<FormToolkit<V>> = useRef(
    givenToolkit ?? new FormToolkit(toolkitOptions as any)
  );

  return (
    <FormContextProvider value={toolkitRef.current}>
      {Component ? (
        <Component />
      ) : typeof children === "function" ? (
        children!(toolkitRef.current)
      ) : (
        children
      )}
    </FormContextProvider>
  );
};
