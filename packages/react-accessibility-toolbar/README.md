# @galicea/react-accessibility-toolbar

Konfigurowalny panel dostępności cyfrowej (powiększanie czcionki, wysoki
kontrast, zwijanie do małego przycisku) do wielokrotnego użytku w różnych
aplikacjach React/Next.js.

Komponent renderuje swój panel jako `position: fixed` zakotwiczony w jednym
z rogów ekranu. Wymaga Tailwind CSS skonfigurowanego tak, by skanował klasy
również w `node_modules/@galicea/react-accessibility-toolbar/dist` (patrz
sekcja "Tailwind" poniżej).

## Instalacja

```
yarn add @galicea/react-accessibility-toolbar
```

## Podstawowe użycie

```tsx
import { AccessibilityToolbar } from '@galicea/react-accessibility-toolbar'

const App = () => (
  <>
    <AccessibilityToolbar />
    {/* reszta aplikacji */}
  </>
)

export default App
```

## Przykład z pełną parametryzacją

```tsx
import { AccessibilityToolbar } from '@galicea/react-accessibility-toolbar'

<AccessibilityToolbar
  position="bottom-left"
  offsetClassName="bottom-4"
  storageKeyPrefix="moja-aplikacja-a11y"
  defaultCollapsed
  persist
  contrastClassName="dark"
  zIndexClassName="z-[999]"
  className="shadow-2xl"
  fontSizeSteps={[
    { multiplier: 1, label: 'A', className: 'text-sm' },
    { multiplier: 1.3, label: 'A+', className: 'text-lg' },
    { multiplier: 1.6, label: 'A++', className: 'text-2xl' },
  ]}
  labels={{
    textSectionLabel: 'Text',
    viewSectionLabel: 'View',
    resetLabel: 'Reset',
    contrastAriaLabel: 'Toggle high contrast',
    collapseAriaLabel: 'Collapse accessibility panel',
    expandAriaLabel: 'Expand accessibility panel',
    collapsedButtonContent: 'A♿',
  }}
/>
```

## Parametry (`TAccessibilityToolbarProps`)

| Parametr | Typ | Domyślnie | Opis |
| --- | --- | --- | --- |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | Róg ekranu, w którym zakotwiczony jest panel. |
| `offsetClassName` | `string` | `'top-20'` / `'bottom-20'` (wg `position`) | Klasa Tailwind odsuwająca panel od krawędzi (np. wysokość navbara). |
| `storageKeyPrefix` | `string` | `'accessibility'` | Prefiks kluczy w `localStorage` – ustaw unikalny na aplikację, jeśli kilka instancji/aplikacji dzieli tę samą domenę. |
| `defaultCollapsed` | `boolean` | `false` | Stan zwinięcia przy pierwszym renderze, zanim odczytane zostaną dane z `localStorage`. |
| `persist` | `boolean` | `true` | Czy zapisywać ustawienia w `localStorage`. |
| `fontSizeSteps` | `{ multiplier: number; label: string; className?: string }[]` | `A / A+ / A++` (1, 1.2, 1.4) | Lista dostępnych kroków powiększenia czcionki. |
| `contrastClassName` | `string` | `'dark'` | Klasa przełączana na `document.documentElement` w trybie wysokiego kontrastu (dopasuj do mechanizmu dark mode swojej aplikacji). |
| `zIndexClassName` | `string` | `'z-50'` | Klasa `z-index` panelu. |
| `className` | `string` | `''` | Dodatkowe klasy doklejane do kontenera panelu (i przycisku w stanie zwiniętym). |
| `labels` | `Partial<TAccessibilityToolbarLabels>` | (polskie etykiety) | Nadpisanie tekstów/aria-labeli – umożliwia i18n bez narzucania biblioteki tłumaczeń. |

Zmiana rozmiaru czcionki działa globalnie przez `document.documentElement.style.fontSize`,
a przełącznik kontrastu przez `classList.toggle(contrastClassName)` na `<html>`.

## Tailwind

Ponieważ pakiet dystrybuowany jest jako skompilowany JS z klasami Tailwind w
kodzie, w `tailwind.config` aplikacji konsumującej należy dodać do `content`:

```js
content: [
  // ...
  './node_modules/@galicea/react-accessibility-toolbar/dist/**/*.{js,mjs}',
]
```

## Budowanie i publikacja

```
yarn install
yarn build      # tsc --emitDeclarationOnly + esbuild -> dist/
```

Publikacja do rejestru Forgejo (`code.galicea.org`) odbywa się automatycznie
przy pushu tagu `vX.Y.Z` (patrz `.forgejo/workflows/publish.yml`), albo
ręcznie przez `publish.sh` / `publish_jurekw.sh` z ustawioną zmienną
`NPM_TOKEN`.
