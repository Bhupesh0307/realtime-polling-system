import { useEffect, useState } from "react";

/**
 * Drives a countdown in seconds from a remaining-time-in-ms value (e.g. from poll state).
 * Updates every second until it hits zero.
 */
export function usePollTimer(remainingTimeMs: number | undefined): number {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (remainingTimeMs == null || typeof remainingTimeMs !== "number") {
      setSecondsLeft(0);
      return;
    }
    const initial = Math.floor(remainingTimeMs / 1000);
    setSecondsLeft(initial);
    if (initial <= 0) return;

    const tick = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(tick);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [remainingTimeMs]);

  return secondsLeft;
}
