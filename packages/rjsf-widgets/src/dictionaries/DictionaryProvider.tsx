import React, { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import type { DictionaryCacheEntry, FetchDictionaryOptions } from './types';

/**
 * Cache for AsyncSelectWidget/TreeSelectWidget options, keyed by
 * `endpoint` + search phrase. Replaces the per-app Redux slice that used
 * to live at `src/store/dictionaries` in every host app (arena/dashboard/
 * edu carried byte-identical copies) - here it is a self-contained React
 * context so the package has no dependency on the host app's store shape.
 */
export const cacheKeyFor = (endpoint: string, q?: string): string => `${endpoint}::${q ?? ''}`;

interface State {
  byKey: Record<string, DictionaryCacheEntry>;
}

type Action =
  | { type: 'pending'; key: string }
  | { type: 'fulfilled'; key: string; options: DictionaryCacheEntry['options'] }
  | { type: 'rejected'; key: string; message: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'pending':
      return {
        byKey: {
          ...state.byKey,
          [action.key]: { options: state.byKey[action.key]?.options ?? [], loading: true, error: null },
        },
      };
    case 'fulfilled':
      return {
        byKey: { ...state.byKey, [action.key]: { options: action.options, loading: false, error: null } },
      };
    case 'rejected':
      return {
        byKey: {
          ...state.byKey,
          [action.key]: { options: state.byKey[action.key]?.options ?? [], loading: false, error: action.message },
        },
      };
    default:
      return state;
  }
}

interface DictionaryContextValue {
  byKey: Record<string, DictionaryCacheEntry>;
  request: (endpoint: string, q?: string) => void;
}

const DictionaryContext = createContext<DictionaryContextValue | null>(null);

export interface DictionaryProviderProps {
  /** Loads options for one dictionary endpoint, e.g. via the host app's own API client. */
  fetchOptions: FetchDictionaryOptions;
  /** Converts an unknown fetch error into a message shown in the widget's dropdown. */
  extractError?: (error: unknown) => string;
  children: React.ReactNode;
}

const defaultExtractError = (error: unknown): string =>
  error instanceof Error ? error.message : 'Błąd pobierania słownika';

export function DictionaryProvider({ fetchOptions, extractError = defaultExtractError, children }: DictionaryProviderProps) {
  const [state, dispatch] = useReducer(reducer, { byKey: {} });
  // Tracks in-flight (endpoint, q) pairs so re-renders/effects don't fire the
  // same request twice while it is already pending.
  const inFlight = useRef<Set<string>>(new Set());

  const request = useCallback(
    (endpoint: string, q?: string) => {
      const key = cacheKeyFor(endpoint, q);
      const existing = state.byKey[key];
      if ((existing && !existing.loading && !existing.error) || inFlight.current.has(key)) {
        return;
      }
      inFlight.current.add(key);
      dispatch({ type: 'pending', key });
      fetchOptions(endpoint, q)
        .then((options) => dispatch({ type: 'fulfilled', key, options }))
        .catch((error) => dispatch({ type: 'rejected', key, message: extractError(error) }))
        .finally(() => inFlight.current.delete(key));
    },
    [extractError, fetchOptions, state.byKey]
  );

  const value = useMemo<DictionaryContextValue>(() => ({ byKey: state.byKey, request }), [state.byKey, request]);

  return <DictionaryContext.Provider value={value}>{children}</DictionaryContext.Provider>;
}

export function useDictionaryContext(): DictionaryContextValue {
  const ctx = useContext(DictionaryContext);
  if (!ctx) {
    throw new Error(
      '[@galicea-lab/rjsf-widgets] AsyncSelectWidget/TreeSelectWidget require a <DictionaryProvider> ' +
        'ancestor (fetchOptions prop) to resolve ui:options.endpoint.'
    );
  }
  return ctx;
}
