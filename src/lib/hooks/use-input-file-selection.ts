"use client";
import { useEffect, useRef, useReducer } from "react";

export function useInputFileSelection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileNames, setFileNames] = useReducer((_current: string[], next: string[]) => next, []);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (form === null || form === undefined) return;

    function handleReset(): void {
      setFileNames([]);
    }

    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, []);

  return { inputRef, fileNames, setFileNames };
}
