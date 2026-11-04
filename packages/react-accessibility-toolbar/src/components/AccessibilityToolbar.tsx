// components/AccessibilityToolbar.tsx

import React, { useEffect, useState } from 'react'

import {
  defaultAccessibilityToolbarConfig,
  defaultOffsetClassName,
  positionToClassName,
  storageKeys,
  TAccessibilityToolbarConfig,
  TAccessibilityToolbarLabels,
} from '../configs/accessibilityToolbar'

export type TAccessibilityToolbarProps = Partial<
  Omit<TAccessibilityToolbarConfig, 'labels'>
> & {
  labels?: Partial<TAccessibilityToolbarLabels>
}

const AccessibilityToolbar = (props: TAccessibilityToolbarProps) => {
  const config: TAccessibilityToolbarConfig = {
    ...defaultAccessibilityToolbarConfig,
    ...props,
    labels: { ...defaultAccessibilityToolbarConfig.labels, ...props.labels },
  }

  const {
    position,
    storageKeyPrefix,
    defaultCollapsed,
    persist,
    fontSizeSteps,
    contrastClassName,
    zIndexClassName,
    className,
    labels,
  } = config

  const offsetClassName = config.offsetClassName || defaultOffsetClassName(position)
  const keys = storageKeys(storageKeyPrefix)

  const [fontSize, setFontSize] = useState(fontSizeSteps[0]?.multiplier ?? 1)
  const [isHighContrast, setIsHighContrast] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  // Inicjalizacja ustawień z localStorage
  useEffect(() => {
    if (!persist) return

    const savedContrast = localStorage.getItem(keys.contrast) === 'true'
    const savedFontSize = parseFloat(
      localStorage.getItem(keys.fontSize) || String(fontSizeSteps[0]?.multiplier ?? 1),
    )
    const savedCollapsedRaw = localStorage.getItem(keys.collapsed)
    const savedCollapsed = savedCollapsedRaw === null ? defaultCollapsed : savedCollapsedRaw === 'true'

    setIsHighContrast(savedContrast)
    setFontSize(savedFontSize)
    setIsCollapsed(savedCollapsed)

    document.documentElement.style.fontSize = `${savedFontSize * 100}%`
    if (savedContrast) document.documentElement.classList.add(contrastClassName)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uruchamiane tylko raz przy montowaniu
  }, [])

  const toggleCollapsed = () => {
    const newVal = !isCollapsed
    setIsCollapsed(newVal)
    if (persist) localStorage.setItem(keys.collapsed, String(newVal))
  }

  const toggleContrast = () => {
    const newVal = !isHighContrast
    setIsHighContrast(newVal)
    if (persist) localStorage.setItem(keys.contrast, String(newVal))
    document.documentElement.classList.toggle(contrastClassName)
  }

  const changeFontSize = (multiplier: number) => {
    setFontSize(multiplier)
    if (persist) localStorage.setItem(keys.fontSize, String(multiplier))
    document.documentElement.style.fontSize = `${multiplier * 100}%`
  }

  const reset = () => {
    const baseMultiplier = fontSizeSteps[0]?.multiplier ?? 1
    setIsHighContrast(false)
    setFontSize(baseMultiplier)
    if (persist) {
      localStorage.removeItem(keys.contrast)
      localStorage.removeItem(keys.fontSize)
    }
    document.documentElement.classList.remove(contrastClassName)
    document.documentElement.style.fontSize = `${baseMultiplier * 100}%`
  }

  const anchorClassName = `fixed ${offsetClassName} ${positionToClassName(position)} ${zIndexClassName}`

  if (isCollapsed) {
    return (
      <button
        onClick={toggleCollapsed}
        className={`${anchorClassName} p-2 bg-white border border-gray-300 shadow-xl dark:bg-slate-800 ${className}`}
        aria-label={labels.expandAriaLabel}
        title={labels.expandAriaLabel}
      >
        <span className="font-bold text-sm">{labels.collapsedButtonContent}</span>
      </button>
    )
  }

  return (
    <div
      className={`${anchorClassName} flex flex-col gap-2 p-2 bg-white border border-gray-300 shadow-xl dark:bg-slate-800 ${className}`}
    >
      <button
        onClick={toggleCollapsed}
        className="self-end text-xs px-1 leading-none opacity-60 hover:opacity-100"
        aria-label={labels.collapseAriaLabel}
        title={labels.collapseAriaLabel}
      >
        ✕
      </button>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-center opacity-70">
          {labels.textSectionLabel}
        </span>
        {fontSizeSteps.map((step) => (
          <button
            key={step.multiplier}
            onClick={() => changeFontSize(step.multiplier)}
            className={`px-2 py-1 ${step.className || 'text-sm'} bg-gray-100 text-gray-900 hover:bg-blue-500 hover:text-white rounded`}
            aria-pressed={fontSize === step.multiplier}
          >
            {step.label}
          </button>
        ))}
      </div>

      <div className="h-[1px] bg-gray-300 my-1" />

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-center opacity-70">
          {labels.viewSectionLabel}
        </span>
        <button
          onClick={toggleContrast}
          className={`p-2 rounded border-2 ${isHighContrast ? 'bg-yellow-400 border-black text-black' : 'bg-black text-white'}`}
          aria-label={labels.contrastAriaLabel}
          aria-pressed={isHighContrast}
        >
          <span className="font-bold">C</span>
        </button>
        <button onClick={reset} className="text-[10px] underline hover:text-red-500 mt-2">
          {labels.resetLabel}
        </button>
      </div>
    </div>
  )
}

export default AccessibilityToolbar
