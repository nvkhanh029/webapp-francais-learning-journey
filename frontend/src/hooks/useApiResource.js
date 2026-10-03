import { useCallback, useEffect, useRef, useState } from "react";

// Generic request state for a page or component that loads one resource (FD §6.6):
// { data, isLoading, error, reload(), refresh() }.
//
// `reload()` starts a visible reload (loading state). `refresh()` refetches the same resource in the
// background: the current data stays on screen, there is no loading state, and a failed refresh keeps
// the data it already has. Use it to re-read backend truth after a confirmed change.
//
// Loading is derived by comparing the key of the finished request against the key of the current one,
// so starting a request never calls setState synchronously inside the effect (which would cascade
// renders). A request whose key no longer matches — a changed route parameter, or a newer reload — is
// reported as loading, so stale data is never shown as current.
//
// `fetcher` must be stable across renders (wrap it in useCallback in the caller); `key` should change
// whenever the requested resource changes, e.g. the slug from useParams.
export default function useApiResource(fetcher, key = "") {
  const [reloadCount, setReloadCount] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const silentRef = useRef(false);
  const [result, setResult] = useState({ key: null, data: null, error: null });

  const currentKey = `${key}#${reloadCount}`;

  useEffect(() => {
    let active = true;
    const silent = silentRef.current;
    silentRef.current = false;
    Promise.resolve()
      .then(fetcher)
      .then((payload) => {
        if (active) setResult({ key: currentKey, data: payload ?? null, error: null });
      })
      .catch((cause) => {
        if (active && !silent) setResult({ key: currentKey, data: null, error: cause });
      });
    return () => {
      active = false;
    };
  }, [currentKey, refreshCount, fetcher]);

  const reload = useCallback(() => setReloadCount((current) => current + 1), []);
  const refresh = useCallback(() => {
    silentRef.current = true;
    setRefreshCount((current) => current + 1);
  }, []);

  const isLoading = result.key !== currentKey;

  return {
    data: isLoading ? null : result.data,
    isLoading,
    error: isLoading ? null : result.error,
    reload,
    refresh,
  };
}
