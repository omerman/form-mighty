import { useEffect, useMemo, useRef } from "react";
import { FormToolkit } from "./FormToolkit";
import { DefaultFormValues, FormToolkitOptions } from "./types";

export interface UseInitForm {
  <V extends DefaultFormValues>(
    options?: FormToolkitOptions<V>
  ): FormToolkit<V>;
}

export const useInitForm: UseInitForm = (options = {}) => {
  const optionsRef = useRef(options);

  const toolkit = useMemo(() => new FormToolkit(optionsRef.current), []);

  return toolkit;
};
