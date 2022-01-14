import { renderHook } from "@testing-library/react-hooks";
import { useInitForm } from "src/lib";
import { FormToolkit } from "src/lib/FormToolkit";

jest.mock("src/lib/FormToolkit");

it("should create FormToolkit", () => {
  const { result } = renderHook(() => useInitForm());

  expect(result.current).toBeInstanceOf(FormToolkit);
});

it("should create FormToolkit with given options", () => {
  const myOptions = {
    initialIsValid: true,
  };

  renderHook(() => useInitForm(myOptions));

  expect(FormToolkit).toHaveBeenCalledWith(myOptions);
});
