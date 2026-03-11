import { useReducer } from "react";

export const incrementReducer = (current: number): number => current + 1 || 1;

export default function useIncrement(initial?: number) {
  const reducer = useReducer(incrementReducer, initial || 0);
  return reducer;
}
