import { FormState, DefaultFormValues } from "./types";
import invariant from "invariant";
import { useEffect, useRef } from "react";
import { FormToolkit } from "./FormToolkit";
import { useForm } from "./useForm";
import { useFormSubscription } from "./useFormSubscription";

export interface FormSubscriberProps<V extends DefaultFormValues, T> {
  subscription: (state: FormState<V>) => T;
  onMount?: (subscriptonResult: T, toolkit: FormToolkit<V>) => void;
  onChange?: (subscriptonResult: T, toolkit: FormToolkit<V>) => void;
  children?: (subscriptonResult: T, toolkit: FormToolkit<V>) => React.ReactNode;
}

export const FormSubscriber = <V extends DefaultFormValues, T>({
  subscription,
  onMount,
  onChange,
  children,
}: FormSubscriberProps<V, T>) => {
  invariant(
    onMount ?? onChange ?? children,
    "FormSubscriber - Must include one of [onMount, onChange, children] props"
  );
  const formToolkit = useForm<V>();

  const subscriptonResult = useFormSubscription<V, T>(
    formToolkit,
    subscription
  );

  const mountedRef = useRef(false);
  const refs = useRef({ onChange, onMount });

  useEffect(() => {
    if (mountedRef.current) {
      refs.current.onChange?.(subscriptonResult, formToolkit);
    } else {
      mountedRef.current = true;
      refs.current.onMount?.(subscriptonResult, formToolkit);
    }
  }, [formToolkit, subscriptonResult]);

  return <>{children?.(subscriptonResult, formToolkit) ?? null}</>;
};
