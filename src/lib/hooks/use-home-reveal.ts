"use client";

import { useEffect, useReducer, useRef } from "react";

const ROOT_MARGIN = "0px 0px -12% 0px";

export function useHomeReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useReducer(() => true, false);

  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setRevealed();
        observer.disconnect();
      },
      { rootMargin: ROOT_MARGIN },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, revealed };
}
