import React, { useRef, useEffect } from "react";
import invariant from "invariant";
import { FormToolkit } from "./FormToolkit";
import { FormContextProvider } from "./context";
import { DefaultFormValues, FormToolkitOptions, Mandatory } from "./types";

export interface FormMightyProps<V extends DefaultFormValues>
  extends FormToolkitOptions<V> {
  toolkit?: FormToolkit<V>;
  component?: React.ComponentType<any>;
  children?:
    | React.ReactNode
    | ((toolkit: FormToolkit<V>) => React.ReactNode | React.ReactNode[]);
}

export const FormMighty: <V>(
  props: FormMightyProps<V>
) => React.ReactElement<any, any> | null = ({
  toolkit: givenToolkit,
  component: Component,
  children,
  ...toolkitOptions
}) => {
  invariant(
    Component ?? children,
    "FormMighty - Must include one of [component, children] props"
  );

  const toolkitRef: React.MutableRefObject<Mandatory<typeof givenToolkit>> =
    useRef(givenToolkit ?? new FormToolkit(toolkitOptions));

  useEffect(() => {
    toolkitRef.current.register();
  }, []);

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
