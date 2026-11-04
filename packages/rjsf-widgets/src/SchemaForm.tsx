/**
 * Uniwersalny formularz: JSON Schema + uiSchema renderowane po stronie
 * serwera i renderowane przez react-jsonschema-form v6, z motywem Tailwind
 * z `./theme`.
 *
 * Bez schematu wywołujący pokazuje zapasowy edytor JSON - ten komponent nie
 * jest wtedy renderowany.
 */

import React, { useMemo } from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { templates, widgets } from './theme';

export interface SchemaFormProps {
  schema: RJSFSchema;
  uiSchema?: UiSchema;
  formData?: Record<string, unknown>;
  disabled?: boolean;
  /** Komunikat błędu do wyświetlenia pod formularzem (np. odpowiedź serwera). */
  error?: string | null;
  /** Wywoływane przy każdej zmianie danych w formularzu. */
  onChange?: (data: Record<string, unknown>) => void;
  /** Wywoływane po przesłaniu formularza (RJSF waliduje przed wywołaniem). */
  onSubmit?: (data: Record<string, unknown>) => void;
}

export const SchemaForm: React.FC<SchemaFormProps> = ({
  schema,
  uiSchema = {},
  formData,
  disabled = false,
  error = null,
  onChange,
  onSubmit,
}) => {
  // Przycisk wysyłania lives w stopce modala - RJSF-owy ukrywamy.
  const effectiveUiSchema = useMemo<UiSchema>(
    () => ({ 'ui:submitButtonOptions': { norender: true }, ...uiSchema }),
    [uiSchema]
  );

  return (
    <div className="space-y-3">
      <Form
        validator={validator}
        schema={schema}
        uiSchema={effectiveUiSchema}
        formData={formData}
        disabled={disabled}
        liveValidate
        showErrorList={false}
        templates={templates}
        widgets={widgets}
        onChange={(e) => onChange?.(e.formData as Record<string, unknown>)}
        onSubmit={(e) => onSubmit?.(e.formData as Record<string, unknown>)}
      >
        <></>
      </Form>
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}
    </div>
  );
};

export default SchemaForm;
