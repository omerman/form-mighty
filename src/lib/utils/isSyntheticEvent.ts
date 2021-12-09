import React from "react";

export const isSyntheticEvent = <T extends React.SyntheticEvent<any, any>>(
  e: any
): e is T & React.SyntheticEvent<any, any> => {
  return (e as React.SyntheticEvent<any, any>).target instanceof EventTarget;
};
