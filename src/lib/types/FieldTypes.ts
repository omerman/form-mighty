import React from "react";

// Override this type to match desired string literal
export type CustomFieldTypeName = never;

export type FieldTypes = {
  [key in "text" | "number" | CustomFieldTypeName]: {
    component: React.FC;
  };
};
