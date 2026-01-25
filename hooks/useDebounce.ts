import { useRef, useEffect, useCallback } from 'react';

export function useDebounce<T extends (...args: any[]) => void>(
    callback: T,
    delay: number
): T {
    const callbackRef = useRef(callback);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const debouncedCallback = useCallback(
        (...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                if (callbackRef.current) {
                    callbackRef.current(...args);
                }
            }, delay);
        },
        [delay]
    );

    return debouncedCallback as T;
}
