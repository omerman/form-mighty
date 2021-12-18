import { waitFor } from "@testing-library/react";

export const waitForTime = (time: number) =>
  waitFor(
    () => new Promise<true>((resolve) => setTimeout(() => resolve(true), time))
  );
