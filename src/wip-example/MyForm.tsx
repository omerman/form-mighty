import { uniqueId } from "lodash";
import { useEffect, useRef } from "react";
import { FormState, FormMighty, FormSubscribtion, useInitForm } from "../lib";

const RenderChecker: React.FC<{ scope?: string }> = ({ scope, children }) => {
  const countRef = useRef(1);

  useEffect(() => {
    countRef.current += 1;
  });

  return (
    <div style={{ margin: 10 }}>
      <div style={{ background: "lightblue", padding: 4 }}>
        <span style={{ background: "lightyellow" }}>Scope - {scope}</span>
        <br />
        <span style={{ background: "lightyellow" }}>
          Renders count: {countRef.current}
        </span>
        <br />
      </div>
      <div style={{ padding: 6, background: "lightgray" }}>
        <div style={{ background: "lightblue", padding: 2, fontSize: 10 }}>
          <span style={{ background: "lightyellow" }}>Children</span>
        </div>
        {children}
      </div>
    </div>
  );
};

export const MyForm: React.FC = () => {
  type MyFormType = { fieldA: string; fieldB: string };
  const toolkit = useInitForm<MyFormType>({
    initialValues: {
      fieldA: "A Initial",
      fieldB: "B",
    },
    validate: async () => {
      return new Promise((resolve) => setTimeout(() => resolve(false), 1000));
    },
  });

  return (
    <RenderChecker scope="root">
      <FormMighty toolkit={toolkit}>
        {(toolkit) => {
          return (
            <RenderChecker scope="root > content">
              <code>Initial State: {JSON.stringify(toolkit.getState())}</code>
              <br />
              <FormSubscribtion
                subscription={({
                  values,
                  isValid,
                  isValidating,
                }: FormState<MyFormType>) => ({
                  subscribedFieldA: values.fieldA,
                })}
              >
                {(results) => (
                  <RenderChecker scope="root > content > fieldA Subscriber">
                    <code>{JSON.stringify(results)}</code>
                    <button
                      onClick={() => {
                        toolkit.updateValues((draft) => {
                          draft.fieldA = uniqueId("A ");
                        });
                      }}
                    >
                      Click To Change A
                    </button>
                    <button
                      onClick={() => {
                        toolkit.updateValues((draft) => {
                          draft.fieldB = uniqueId("B ");
                        });
                      }}
                    >
                      Click To Change B (And admire that this comp doesnt
                      re-render.)
                    </button>
                  </RenderChecker>
                )}
              </FormSubscribtion>
              <FormSubscribtion
                subscription={(state: FormState<MyFormType>) => state}
              >
                {(entireState) => (
                  <RenderChecker scope="root > content > entire state Subscriber">
                    <code>{JSON.stringify(entireState)}</code>
                  </RenderChecker>
                )}
              </FormSubscribtion>
            </RenderChecker>
          );
        }}
      </FormMighty>
    </RenderChecker>
  );
};
