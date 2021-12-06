import { get } from "lodash";
import { FieldPath } from "./types/FieldPath";
import { useForm } from "./useForm";

export interface FieldProps<FP extends FieldPath.FieldPath<any, any> = string> {
  fieldPath: FP extends string ? FP : never;
  children: (value: FieldPath.InferFieldValue<FP>) => React.ReactNode;
}

export const Field: <FP extends FieldPath.FieldPath<any, any> = string>(
  props: FieldProps<FP>
) => React.ReactElement<any, any> | null = ({ children, fieldPath }) => {
  const toolkit = useForm();
  return <>{children(get(toolkit.getState().values, fieldPath as any))}</>;
};
