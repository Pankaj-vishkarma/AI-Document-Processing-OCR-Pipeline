import { createContext, useCallback, useContext, useEffect, useState } from "react";

const UploadQueueContext = createContext();
const STORAGE_KEY = "uploadQueue";

const loadStoredQueue = () => {
    if (typeof window === "undefined") return [];

    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed)
            ? parsed.map((item) => ({
                ...item,
                file: null,
            }))
            : [];
    } catch {
        return [];
    }
};

export const UploadQueueProvider = ({ children }) => {
    const [queue, setQueueState] = useState(loadStoredQueue);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    queue.map(({ file, ...item }) => ({
                        ...item,
                    }))
                )
            );
        } catch {
            // ignore storage failures
        }
    }, [queue]);

    const setQueue = useCallback((next) => {
        setQueueState(next);
    }, []);

    const addQueueItems = useCallback((items) => {
        setQueueState((prev) => {
            const nextItems = items.filter(
                (item) => !prev.some((existing) => existing.id === item.id)
            );
            if (nextItems.length === 0) return prev;
            return [...prev, ...nextItems].slice(0, 50);
        });
    }, []);

    const updateQueueItem = useCallback((id, updater) => {
        setQueueState((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
    }, []);

    const removeQueueItem = useCallback((id) => {
        setQueueState((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const clearQueue = useCallback(() => {
        setQueueState([]);
    }, []);

    return (
        <UploadQueueContext.Provider
            value={{ queue, setQueue, addQueueItems, updateQueueItem, removeQueueItem, clearQueue }}
        >
            {children}
        </UploadQueueContext.Provider>
    );
};

export const useUploadQueue = () => useContext(UploadQueueContext);
