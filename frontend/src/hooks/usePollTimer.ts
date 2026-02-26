import { useEffect, useMemo, useRef, useState } from "react";

function formatMs(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function usePollTimer(remainingTimeMs?: number) {
  const [timeLeft, setTimeLeft] = useState<number>(remainingTimeMs ?? 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setTimeLeft(remainingTimeMs ?? 0);
  }, [remainingTimeMs]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeLeft <= 0) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(prev - 1000, 0);
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timeLeft]);

  const formattedTime = useMemo(() => formatMs(timeLeft), [timeLeft]);

  return { timeLeft, formattedTime };
}

