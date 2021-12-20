import invariant from "invariant";
import { shallowEqual, useSelector } from "react-redux";
import { FormToolkit } from "./FormToolkit";
import { DefaultFormValues, FormState } from "./types";
import { useForm } from "./useForm";

export const useFormSubscription = <
  V extends DefaultFormValues,
  T = FormState<V>
>(
  ...args:
    | []
    | [FormToolkit<V>?, ((state: FormState<V>) => T)?]
    | [(state: FormState<V>) => T]
): T => {
  const contextTk = useForm<V>();

  const tk = args[0] instanceof FormToolkit ? args[0] : undefined;
  const subscriptionFn =
    (args[0] instanceof FormToolkit ? args[1] : args[0]) ?? ((state) => state);

  invariant(
    contextTk || tk,
    "useFormSubscription - Either use inside FormMighty scope or pass toolkit as the first argument"
  );

  return useSelector(
    () => subscriptionFn((tk ?? contextTk).getState()),
    shallowEqual
  ) as T;
};
