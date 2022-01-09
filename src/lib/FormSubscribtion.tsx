import { FormState, DefaultFormValues } from "./types";
import invariant from "invariant";
import { FormToolkit } from "./FormToolkit";
import { useForm } from "./useForm";
import { useFormSubscription } from "./useFormSubscription";

export interface FormSubscribtionProps<V extends DefaultFormValues, T> {
  subscription: (state: FormState<V>) => T;
  children: (subscriptonResult: T, toolkit: FormToolkit<V>) => React.ReactNode;
}

export const FormSubscribtion = <V extends DefaultFormValues, T>({
  subscription,
  children,
}: FormSubscribtionProps<V, T>) => {
  invariant(children, "FormSubscribtion - Must include children");
  const formToolkit = useForm<V>();

  const subscriptonResult = useFormSubscription<V, T>(
    formToolkit,
    subscription
  );

  return <>{children(subscriptonResult, formToolkit)}</>;
};
