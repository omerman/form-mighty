import { waitFor } from "@testing-library/react";

export const waitForTime = (time: number) =>
  waitFor(
    () => new Promise<true>((resolve) => setTimeout(() => resolve(true), time))
  );

export const waitForExpression = <E>(getExpression: () => E, expectation: E) =>
  waitFor(() => expect(getExpression()).toBe(expectation));
