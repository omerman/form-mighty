import invariant from "invariant";
import { useEffect, useRef, useState } from "react";
import { FormToolkit } from "./FormToolkit";
import { DefaultFormValues, FormState } from "./types";
import { useForm } from "./useForm";
import shallowEqual from "./utils/shallowEquals";

export interface UseFormSubscription {
  <V extends DefaultFormValues, T = FormState<V>>(
    ...args:
      | []
      | [FormToolkit<V>?, ((state: FormState<V>) => T)?]
      | [(state: FormState<V>) => T]
  ): T;
}

export const useFormSubscription: UseFormSubscription = (...args) => {
  const contextTk = useForm<any>();

  const tk = args[0] instanceof FormToolkit ? args[0] : undefined;
  const subscriptionFn =
    (args[0] instanceof FormToolkit ? args[1] : args[0]) ?? ((state) => state);

  invariant(
    contextTk || tk,
    "useFormSubscription - Either use inside FormMighty scope or pass toolkit as the first argument"
  );

  const subscriptionFnRef = useRef<typeof subscriptionFn>(subscriptionFn);
  subscriptionFnRef.current = subscriptionFn;
  const [result, setResult] = useState<any>(
    subscriptionFnRef.current((tk ?? contextTk).getState())
  );

  useEffect(() => {
    const toolkit = tk ?? contextTk;
    const unsubscribe = toolkit.subscribe((state) => {
      setResult((currRes: any) => {
        const nextRes = subscriptionFnRef.current(state);
        if (!shallowEqual(currRes, nextRes)) {
          return nextRes;
        } else {
          return currRes;
        }
      });
    });

    return unsubscribe;
  }, [tk, contextTk]);

  return result as any;
};
