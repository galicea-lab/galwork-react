// configs/accessibilityToolbar.ts

export type TAccessibilityToolbarPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'

export type TFontSizeStep = {
  multiplier: number
  label: string
  /** Klasa tailwind rozmiaru czcionki etykiety przycisku, np. 'text-sm'. */
  className?: string
}

export type TAccessibilityToolbarLabels = {
  textSectionLabel: string
  viewSectionLabel: string
  resetLabel: string
  contrastAriaLabel: string
  collapseAriaLabel: string
  expandAriaLabel: string
  /** Zawartość małego przycisku widocznego po zwinięciu panelu. */
  collapsedButtonContent: string
}

export type TAccessibilityToolbarConfig = {
  /** Róg ekranu, w którym zakotwiczony jest panel. */
  position: TAccessibilityToolbarPosition
  /**
   * Klasy tailwind odsuwające panel od krawędzi wzdłuż osi prostopadłej do zakotwiczenia
   * (np. wysokość navbara). Gdy nie podane, dobierane automatycznie na podstawie `position`
   * (`top-20` dla góry, `bottom-20` dla dołu) – patrz `defaultOffsetClassName`.
   */
  offsetClassName?: string
  /** Prefiks kluczy w localStorage – pozwala uniknąć kolizji między aplikacjami/instancjami na tej samej domenie. */
  storageKeyPrefix: string
  /** Czy panel ma być domyślnie zwinięty przy pierwszym renderze (przed odczytem z localStorage). */
  defaultCollapsed: boolean
  /** Czy zapisywać ustawienia w localStorage. */
  persist: boolean
  /** Dostępne kroki powiększenia czcionki. */
  fontSizeSteps: TFontSizeStep[]
  /** Klasa przełączana na document.documentElement w trybie wysokiego kontrastu. */
  contrastClassName: string
  /** Klasa z-index panelu. */
  zIndexClassName: string
  /** Dodatkowe klasy doklejane do kontenera panelu. */
  className: string
  labels: TAccessibilityToolbarLabels
}

export const defaultAccessibilityToolbarConfig: TAccessibilityToolbarConfig = {
  position: 'top-right',
  storageKeyPrefix: 'accessibility',
  defaultCollapsed: false,
  persist: true,
  fontSizeSteps: [
    { multiplier: 1, label: 'A', className: 'text-sm' },
    { multiplier: 1.2, label: 'A+', className: 'text-lg' },
    { multiplier: 1.4, label: 'A++', className: 'text-xl' },
  ],
  contrastClassName: 'dark',
  zIndexClassName: 'z-50',
  className: '',
  labels: {
    textSectionLabel: 'Tekst',
    viewSectionLabel: 'Widok',
    resetLabel: 'Reset',
    contrastAriaLabel: 'Przełącz wysoki kontrast',
    collapseAriaLabel: 'Zwiń panel dostępności',
    expandAriaLabel: 'Rozwiń panel dostępności',
    collapsedButtonContent: 'A♿',
  },
}

const positionClassMap: Record<TAccessibilityToolbarPosition, string> = {
  'top-right': 'right-0 rounded-l-lg',
  'top-left': 'left-0 rounded-r-lg',
  'bottom-right': 'right-0 rounded-l-lg',
  'bottom-left': 'left-0 rounded-r-lg',
}

export const positionToClassName = (position: TAccessibilityToolbarPosition): string =>
  positionClassMap[position]

export const defaultOffsetClassName = (position: TAccessibilityToolbarPosition): string =>
  position.startsWith('top') ? 'top-20' : 'bottom-20'

export const storageKeys = (prefix: string) => ({
  contrast: `${prefix}-contrast`,
  fontSize: `${prefix}-font-size`,
  collapsed: `${prefix}-collapsed`,
})
