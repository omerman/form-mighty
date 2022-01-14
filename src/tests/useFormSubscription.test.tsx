import { act, renderHook } from "@testing-library/react-hooks";
import { FormMighty, FormState } from "src/lib";
import { FormToolkit } from "src/lib/FormToolkit";
import { useFormSubscription } from "src/lib/useFormSubscription";

it("should work", () => {
  const { result } = renderHook(() => useFormSubscription(new FormToolkit()));

  expect(result.error).not.toBeDefined();
});

it("should return the entire form state if passing a toolkit instance", () => {
  const tk = new FormToolkit();
  const { result } = renderHook(() => useFormSubscription(tk));

  expect(result.current).toBe(tk.getState());
});

it("should use the toolkit from context if not passed", () => {
  const tk = new FormToolkit({ initialValues: { value: 5 } });

  const Wrapper: React.FC = ({ children }) => {
    return <FormMighty toolkit={tk}>{children}</FormMighty>;
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

  const { result } = renderHook(() => useFormSubscription(tk));

  act(() => {
    tk.updateValues((draft) => {
      draft.value = 2;
    });
  });

  expect(result.current).toBe(tk.getState());
});

it("should return a form state using a given subscriptionFn", async () => {
  const tk = new FormToolkit({
    initialValues: { value: 1 },
  });

  const { result } = renderHook(() =>
    useFormSubscription(tk, (state) => state.values.value)
  );

  expect(result.current).toBe(tk.getState().values.value);
});

it("should accept subscriptionFn as first argument and use context's toolkit", async () => {
  type MyForm = { value: number };
  const tk = new FormToolkit<MyForm>({
    initialValues: { value: 1 },
  });

  const Wrapper: React.FC = ({ children }) => {
    return <FormMighty toolkit={tk}>{children}</FormMighty>;
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

  const { result } = renderHook(() =>
    useFormSubscription(tk, (state) => ({ ...state.initialValues }))
  );

  tk.updateValues((draft) => {
    draft.value = 2;
  });

  expect(result.all.length).toBe(1);
});
