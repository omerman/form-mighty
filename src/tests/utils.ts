import { waitFor } from "@testing-library/react";

export const waitForTime = (time: number) =>
  waitFor(
    () => new Promise<true>((resolve) => setTimeout(() => resolve(true), time))
  );

export const waitForExpression = <E>(getExpression: () => E, expectation: E) =>
  waitFor(() => expect(getExpression()).toBe(expectation));

export const expectToThrow = (func: () => unknown): void => {
  // Even though the error is caught, it still gets printed to the console
  // so we mock that out to avoid the wall of red text.
  const spy = jest.spyOn(console, "error");
  spy.mockImplementation(() => {});

  expect(func).toThrow();

  spy.mockRestore();
};
