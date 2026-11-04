/**
 * RJSF widget for fields migrated from Webcon of type "Pole wyboru"/"Osoba
 * lub grupa"/"Spółka"/"Drzewo wyboru" with a dynamic source (REST/database,
 * user directory).
 *
 * The backend (form schema generator) sets `"ui:widget": "AsyncSelectWidget"`
 * (or `"TreeSelectWidget"` - treated identically here, see the export at the
 * bottom) and `ui:options.endpoint` to a full API path, e.g.
 * `/v1/wf/dictionaries/kierunki`. This component:
 *
 *  1. on focus and on every change of the typed query (debounced) asks the
 *     host app to resolve that endpoint via the `fetchOptions` passed to
 *     the surrounding `DictionaryProvider`, and renders the result as a
 *     dropdown list,
 *  2. results are cached (in the provider) by endpoint+query key - the same
 *     dictionary used on several form fields (or re-opening the same field)
 *     does not hit the API twice for the same query,
 *  3. a field without `endpoint` (form configuration error) renders a
 *     readable message instead of silently doing nothing.
 *
 * The label of the selected value is only known right after picking it from
 * the list (`value` only stores the raw `value`, not the `label`) - when
 * re-entering an already filled field we show the raw `value` until the
 * user starts searching again. This is a deliberate limitation (resolving a
 * single `value` back to its label would need a dedicated backend lookup).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from '@rjsf/utils';
import { cacheKeyFor, useDictionaryContext } from '../dictionaries/DictionaryProvider';
import type { DictionaryOption } from '../dictionaries/types';

const INPUT =
  'w-full text-xs px-3 py-2 border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 read-only:bg-slate-50';
const INPUT_OK = 'border-slate-200';
const INPUT_ERR = 'border-rose-300 bg-rose-50';

const DEBOUNCE_MS = 300;

function AsyncSelectWidgetImpl(props: WidgetProps) {
  const {
    id,
    value,
    disabled,
    readonly,
    required,
    placeholder,
    options,
    onChange,
    onBlur,
    onFocus,
    rawErrors,
    hideError,
  } = props;

  const endpoint = typeof options?.endpoint === 'string' ? options.endpoint : null;
  const { byKey, request } = useDictionaryContext();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New value from outside (e.g. a different record loaded into the form) -
  // the label from a previous selection is no longer trustworthy. Syncing
  // state to a prop change during render (not in an effect), per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes -
  // avoids a cascading setState inside useEffect.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setSelectedLabel(null);
  }

  const cacheKey = endpoint ? cacheKeyFor(endpoint, query.trim() || undefined) : null;
  const entry = cacheKey ? byKey[cacheKey] : undefined;
  const optionsList: DictionaryOption[] = entry?.options ?? [];
  const loading = entry?.loading ?? false;
  const fetchError = entry?.error ?? null;

  useEffect(() => {
    if (!endpoint || !open) {
      return undefined;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      request(endpoint, query.trim() || undefined);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [endpoint, open, query, request]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const displayValue = useMemo(() => {
    if (open) return query;
    if (selectedLabel) return selectedLabel;
    if (value === undefined || value === null || value === '') return '';
    return String(value);
  }, [open, query, selectedLabel, value]);

  const hasError = !hideError && !!rawErrors && rawErrors.length > 0;

  const handleFocusInput = () => {
    if (readonly || disabled) return;
    setOpen(true);
    setQuery('');
    onFocus?.(id, value);
    if (endpoint) {
      request(endpoint, undefined);
    }
  };

  const handleSelect = (option: DictionaryOption) => {
    onChange(option.value);
    setSelectedLabel(option.label);
    setQuery('');
    setOpen(false);
  };

  const handleClear = (event: React.MouseEvent) => {
    event.preventDefault();
    onChange(options.emptyValue ?? '');
    setSelectedLabel(null);
    setQuery('');
  };

  if (!endpoint) {
    return (
      <div className="text-xs text-rose-600">
        Pole nie ma skonfigurowanego <code>ui:options.endpoint</code> (AsyncSelectWidget).
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          id={id}
          type="text"
          className={`${INPUT} ${hasError ? INPUT_ERR : INPUT_OK} pr-7`}
          value={displayValue}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readonly}
          autoComplete="off"
          onFocus={handleFocusInput}
          onChange={(event) => setQuery(event.target.value)}
          onBlur={(event) => {
            // Small delay so a click on an option from the list is handled
            // before the input's blur closes it.
            window.setTimeout(() => setOpen(false), 100);
            onBlur?.(id, event.target.value);
          }}
        />
        {!readonly && !disabled && value ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={handleClear}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
            aria-label="Wyczyść pole"
          >
            ×
          </button>
        ) : null}
      </div>

      {open && !readonly && !disabled && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg text-xs">
          {loading && <div className="px-3 py-2 text-slate-400">Wyszukiwanie...</div>}
          {!loading && fetchError && <div className="px-3 py-2 text-rose-600">{fetchError}</div>}
          {!loading && !fetchError && optionsList.length === 0 && (
            <div className="px-3 py-2 text-slate-400">Brak wyników</div>
          )}
          {!loading &&
            !fetchError &&
            optionsList.map((option) => (
              <button
                type="button"
                key={option.value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(option)}
                className={`block w-full text-left px-3 py-1.5 hover:bg-blue-50 ${
                  option.value === value ? 'bg-blue-50 font-medium' : ''
                }`}
              >
                {option.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export const AsyncSelectWidget = AsyncSelectWidgetImpl;
/** The backend doesn't yet distinguish a hierarchy for "Drzewo wyboru" -
 * the same search/list component, see module docstring. */
export const TreeSelectWidget = AsyncSelectWidgetImpl;

export default AsyncSelectWidget;
