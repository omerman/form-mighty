import { FormState, DefaultFormValues } from "./types";
import invariant from "invariant";
import { FormToolkit } from "./FormToolkit";
import { useForm } from "./useForm";
import { useFormSelector } from "./useFormSelector";

export interface FormSubscribtionProps<V extends DefaultFormValues, T> {
  selector: (state: FormState<V>) => T;
  children: (subscriptonResult: T, toolkit: FormToolkit<V>) => React.ReactNode;
}

export const FormSubscribtion = <V extends DefaultFormValues, T>({
  selector,
  children,
}: FormSubscribtionProps<V, T>) => {
  invariant(children, "FormSubscribtion - Must include children");
  const formToolkit = useForm<V>();

  const subscriptonResult = useFormSelector<V, T>(formToolkit, selector);

  return <>{children(subscriptonResult, formToolkit)}</>;
};
