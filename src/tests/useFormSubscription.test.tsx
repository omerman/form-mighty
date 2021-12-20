import { renderHook } from "@testing-library/react-hooks";
import { FormMighty, FormProvider, FormState } from "src/lib";
import { FormToolkit } from "src/lib/FormToolkit";
import { useFormSubscription } from "src/lib/useFormSubscription";

it("should work", () => {
  const Wrapper: React.FC = ({ children }) => {
    return <FormProvider>{children}</FormProvider>;
  };

  const { result } = renderHook(() => useFormSubscription(new FormToolkit()), {
    wrapper: Wrapper,
  });

  expect(result.error).not.toBeDefined();
});

it("should return the entire form state if passing a toolkit instance", () => {
  const Wrapper: React.FC = ({ children }) => {
    return <FormProvider>{children}</FormProvider>;
  };

  const tk = new FormToolkit();
  const { result } = renderHook(() => useFormSubscription(tk), {
    wrapper: Wrapper,
  });

  expect(result.current).toBe(tk.getState());
});

it("should use the toolkit from context if not passed", () => {
  const tk = new FormToolkit({ initialValues: { value: 5 } });

  const Wrapper: React.FC = ({ children }) => {
    return (
      <FormProvider>
        <FormMighty toolkit={tk}>{children}</FormMighty>
      </FormProvider>
    );
  };

  const { result } = renderHook(() => useFormSubscription(), {
    wrapper: Wrapper,
  });

  expect(result.current).toBe(tk.getState());
});

it("should return a reactive form state", async () => {
  const tk = new FormToolkit({
    initialValues: { value: 1 },
  });

  const Wrapper: React.FC = ({ children }) => {
    return <FormProvider>{children}</FormProvider>;
  };

  const { result } = renderHook(() => useFormSubscription(tk), {
    wrapper: Wrapper,
  });

  tk.updateValues((draft) => {
    draft.value = 2;
  });

  expect(result.current).toBe(tk.getState());
});

it("should return a form state using a given subscriptionFn", async () => {
  const tk = new FormToolkit({
    initialValues: { value: 1 },
  });

  const Wrapper: React.FC = ({ children }) => {
    return <FormProvider>{children}</FormProvider>;
  };

  const { result } = renderHook(
    () => useFormSubscription(tk, (state) => state.values.value),
    {
      wrapper: Wrapper,
    }
  );

  expect(result.current).toBe(tk.getState().values.value);
});

it("should accept subscriptionFn as first argument and use context's toolkit", async () => {
  type MyForm = { value: number };
  const tk = new FormToolkit<MyForm>({
    initialValues: { value: 1 },
  });

  const Wrapper: React.FC = ({ children }) => {
    return (
      <FormProvider>
        <FormMighty toolkit={tk}>{children}</FormMighty>
      </FormProvider>
    );
  };

  const { result } = renderHook(
    () => useFormSubscription((state: FormState<MyForm>) => state.values.value),
    {
      wrapper: Wrapper,
    }
  );

  expect(result.current).toBe(tk.getState().values.value);
});

it("should not trigger render if result equals shallowly", async () => {
  const tk = new FormToolkit({
    initialValues: { value: 1 },
  });

  const Wrapper: React.FC = ({ children }) => {
    return <FormProvider>{children}</FormProvider>;
  };

  const { result } = renderHook(
    () => useFormSubscription(tk, (state) => ({ ...state.initialValues })),
    {
      wrapper: Wrapper,
    }
  );

  tk.updateValues((draft) => {
    draft.value = 2;
  });

  expect(result.all.length).toBe(1);
});
