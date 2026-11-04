# @galicea-lab/rjsf-widgets

Tailwind theme, `SchemaForm` wrapper and custom widgets for
[react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form)
(RJSF), shared across the Galwork apps (arena/dashboard/edu).

Includes:

- `SchemaForm` - thin wrapper around RJSF's `Form` wired up with the theme below.
- `templates`, `widgets`, `defaultTemplates` - a Tailwind-styled RJSF theme.
- `AsyncSelectWidget` / `TreeSelectWidget` - a combobox widget for fields with
  a dynamic option source (`ui:options.endpoint`), with request
  debouncing and response caching.
- `DictionaryProvider` - supplies the `fetchOptions` function
  `AsyncSelectWidget` uses to resolve an endpoint, and owns the
  endpoint+query cache. The host app provides the actual HTTP call (its own
  API client, auth, base URL), so this package carries no knowledge of any
  specific backend.

## Usage

```tsx
import { DictionaryProvider, SchemaForm } from '@galicea-lab/rjsf-widgets';
import { dictionariesApi } from '@/api/dictionaries';

function App() {
  return (
    <DictionaryProvider fetchOptions={dictionariesApi.listOptions}>
      <SchemaForm schema={schema} uiSchema={uiSchema} onSubmit={handleSubmit} />
    </DictionaryProvider>
  );
}
```

`DictionaryProvider` can wrap the whole app (e.g. in `_app.tsx`) so the
options cache is shared across every form on the page; `fetchOptions` only
needs to match the signature `(endpoint: string, q?: string) => Promise<{ value: string; label: string }[]>`.

Fields get the custom widgets by setting, in `uiSchema`:

```json
{ "ui:widget": "AsyncSelectWidget", "ui:options": { "endpoint": "/v1/wf/dictionaries/kierunki" } }
```

## Using only the theme/widgets without `SchemaForm`

If a host app renders `<Form>` directly instead of through `SchemaForm`,
import `templates`/`widgets` from this package and pass them along with your
own RJSF `<Form>`, still wrapping the tree in `DictionaryProvider`.
