import { useCallback, useEffect, useState } from "react";

// Generic request state for a page or component that loads one resource (FD §6.6):
// { data, isLoading, error, reload() }.
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
  const [result, setResult] = useState({ key: null, data: null, error: null });

  const currentKey = `${key}#${reloadCount}`;

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(fetcher)
      .then((payload) => {
        if (active) setResult({ key: currentKey, data: payload ?? null, error: null });
      })
      .catch((cause) => {
        if (active) setResult({ key: currentKey, data: null, error: cause });
      });
    return () => {
      active = false;
    };
  }, [currentKey, fetcher]);

  const reload = useCallback(() => setReloadCount((current) => current + 1), []);

  const isLoading = result.key !== currentKey;

  return {
    data: isLoading ? null : result.data,
    isLoading,
    error: isLoading ? null : result.error,
    reload,
  };
}
