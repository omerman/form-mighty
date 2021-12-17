import produce from "immer";
import { RootAction, RootState } from "./types";

const initialState: RootState = {};

export const reducer = (state = initialState, action: RootAction) => {
  return produce(state, (draft) => {
    switch (action.type) {
      case "@FORM_MIGHTY/updateFormState": {
        const { uniqueKey, formState } = action.payload;
        draft[uniqueKey] = formState;
        break;
      }
    }
  });
};
