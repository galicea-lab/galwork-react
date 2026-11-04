/**
 * Theme RJSF w stylu Tailwind używanym w aplikacjach Galwork.
 *
 * Nadpisujemy szablony i widgety, które renderują własny markup (labelki, błędy,
 * pola wejściowe, tabele list) - bootstrapowe klasy `form-group`/`form-control`
 * nie mają tu żadnego stylu. Pola tablicowe/obiektowe, `WrapIfAdditional` i
 * reszta szablonów zostają domyślne.
 */

import React from 'react';
import Form, { getDefaultRegistry, RichDescription, RichHelp } from '@rjsf/core';
import type {
  ArrayFieldItemTemplateProps,
  ArrayFieldTemplateProps,
  BaseInputTemplateProps,
  DescriptionFieldProps,
  ErrorListProps,
  FieldErrorProps,
  FieldHelpProps,
  FieldTemplateProps,
  IconButtonProps,
  ObjectFieldTemplateProps,
  SubmitButtonProps,
  TitleFieldProps,
  WidgetProps,
} from '@rjsf/utils';
import {
  ADDITIONAL_PROPERTY_FLAG,
  buttonId,
  canExpand,
  descriptionId,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  enumOptionsDeselectValue,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  errorId,
  getOptionValueFormat,
  getInputProps,
  getSubmitButtonOptions,
  getUiOptions,
  helpId,
  optionId,
  titleId,
} from '@rjsf/utils';
import { Icon } from '@iconify/react';
import { AsyncSelectWidget, TreeSelectWidget } from './widgets/AsyncSelectWidget';

const INPUT =
  'w-full text-xs px-3 py-2 border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 read-only:bg-slate-50';
const INPUT_OK = 'border-slate-200';
const INPUT_ERR = 'border-rose-300 bg-rose-50';
const TOOL_BTN =
  'inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition-colors';
const TOOL_BTN_DANGER = 'border-rose-200 text-rose-500 hover:bg-rose-50';

const inputCls = (hasError: boolean) => `${INPUT} ${hasError ? INPUT_ERR : INPUT_OK}`;

/* ------------------------------------------------------------------ */
/* Szablony                                                            */
/* ------------------------------------------------------------------ */

function BaseInputTemplate(props: BaseInputTemplateProps) {
  const {
    id,
    htmlName,
    value,
    readonly,
    disabled,
    autofocus,
    onBlur,
    onFocus,
    onChange,
    onChangeOverride,
    options,
    schema,
    rawErrors,
    type,
    hideError,
    required,
    placeholder,
    multiple,
  } = props;
  const inputProps = getInputProps(schema, type, options);
  const hasError = !hideError && !!rawErrors && rawErrors.length > 0;
  const isNumeric = inputProps.type === 'number' || inputProps.type === 'integer';
  const inputValue = isNumeric ? (value || value === 0 ? value : '') : value == null ? '' : value;

  const handleChange = ({ target: { value: newValue } }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(newValue === '' ? options.emptyValue : newValue);
  const handleBlur = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, target?.value);
  const handleFocus = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, target?.value);

  return (
    <input
      id={id}
      name={htmlName || id}
      className={inputCls(hasError)}
      readOnly={readonly}
      disabled={disabled}
      autoFocus={autofocus}
      value={inputValue}
      required={required}
      placeholder={placeholder}
      multiple={multiple}
      {...inputProps}
      onChange={onChangeOverride || handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  );
}

function TextareaWidget(props: WidgetProps) {
  const {
    id,
    htmlName,
    value,
    options,
    placeholder,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    rawErrors,
    hideError,
  } = props;
  const hasError = !hideError && !!rawErrors && rawErrors.length > 0;
  const rows = typeof options.rows === 'number' ? options.rows : 6;

  const handleChange = ({ target }: React.ChangeEvent<HTMLTextAreaElement>) =>
    onChange(target.value === '' ? options.emptyValue : target.value);
  const handleBlur = ({ target }: React.FocusEvent<HTMLTextAreaElement>) =>
    onBlur(id, target?.value);
  const handleFocus = ({ target }: React.FocusEvent<HTMLTextAreaElement>) =>
    onFocus(id, target?.value);

  return (
    <textarea
      id={id}
      name={htmlName || id}
      className={`${inputCls(hasError)} resize-y font-mono leading-relaxed`}
      value={value == null ? '' : value}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      readOnly={readonly}
      autoFocus={autofocus}
      rows={rows}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  );
}

function SelectWidget(props: WidgetProps) {
  const {
    schema,
    id,
    htmlName,
    options,
    value,
    required,
    disabled,
    readonly,
    multiple = false,
    autofocus = false,
    onChange,
    onBlur,
    onFocus,
    placeholder,
    rawErrors,
    hideError,
  } = props;
  const { enumOptions, enumDisabled, emptyValue: empty } = options;
  const emptyValue = multiple ? [] : '';
  const optionValueFormat = getOptionValueFormat(options);
  const hasError = !hideError && !!rawErrors && rawErrors.length > 0;

  const getValue = (target: HTMLSelectElement) =>
    multiple
      ? Array.from(target.options)
          .filter((o) => o.selected)
          .map((o) => o.value)
      : target.value;

  const handleBlur = (event: React.FocusEvent<HTMLSelectElement>) =>
    onBlur(
      id,
      enumOptionValueDecoder(
        getValue(event.target),
        enumOptions,
        optionValueFormat,
        empty ?? emptyValue
      )
    );
  const handleFocus = (event: React.FocusEvent<HTMLSelectElement>) =>
    onFocus(
      id,
      enumOptionValueDecoder(
        getValue(event.target),
        enumOptions,
        optionValueFormat,
        empty ?? emptyValue
      )
    );
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) =>
    onChange(
      enumOptionValueDecoder(
        getValue(event.target),
        enumOptions,
        optionValueFormat,
        empty ?? emptyValue
      )
    );

  const selectValue = enumOptionSelectedValue(
    value,
    enumOptions,
    multiple,
    optionValueFormat,
    emptyValue
  );
  const showPlaceholderOption = !multiple && schema.default === undefined;

  return (
    <select
      id={id}
      name={htmlName || id}
      multiple={multiple}
      className={`${inputCls(hasError)} ${multiple ? 'min-h-20' : ''}`}
      value={selectValue}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
    >
      {showPlaceholderOption && <option value="">{placeholder || '—'}</option>}
      {Array.isArray(enumOptions) &&
        enumOptions.map(({ value: enumValue, label: enumLabel }, i) => {
          const isDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(enumValue);
          return (
            <option
              key={String(enumValue)}
              value={enumOptionValueEncoder(enumValue, i, optionValueFormat)}
              disabled={isDisabled}
            >
              {enumLabel}
            </option>
          );
        })}
    </select>
  );
}

function CheckboxWidget(props: WidgetProps) {
  const {
    id,
    htmlName,
    value,
    label,
    hideLabel,
    disabled,
    readonly,
    autofocus = false,
    required,
    onChange,
    onBlur,
    onFocus,
  } = props;
  const handleChange = ({ target }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(target.checked);
  const handleBlur = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, target?.checked);
  const handleFocus = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, target?.checked);

  return (
    <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
      <input
        type="checkbox"
        id={id}
        name={htmlName || id}
        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
        checked={typeof value === 'undefined' ? false : value}
        required={required}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
      />
      {!hideLabel && <span>{label}</span>}
    </label>
  );
}

function RadioWidget(props: WidgetProps) {
  const {
    id,
    htmlName,
    options,
    value,
    required,
    disabled,
    readonly,
    autofocus = false,
    onChange,
    onBlur,
    onFocus,
  } = props;
  const { enumOptions, enumDisabled, inline, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);

  const handleBlur = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder(target?.value, enumOptions, optionValueFormat, emptyValue));
  const handleFocus = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder(target?.value, enumOptions, optionValueFormat, emptyValue));

  return (
    <div id={id} role="radiogroup" className={inline ? 'flex flex-wrap gap-x-4 gap-y-1.5' : 'space-y-1.5'}>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, i) => {
          const checked = enumOptionsIsSelected(option.value, value);
          const itemDisabled =
            (Array.isArray(enumDisabled) && enumDisabled.includes(option.value)) ||
            disabled ||
            readonly;
          return (
            <label
              key={String(option.value)}
              className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
            >
              <input
                type="radio"
                id={optionId(id, i)}
                name={htmlName || id}
                className="h-3.5 w-3.5 border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={checked}
                required={required && i === 0}
                value={enumOptionValueEncoder(option.value, i, optionValueFormat)}
                disabled={itemDisabled}
                autoFocus={autofocus && i === 0}
                onChange={() => onChange(option.value)}
                onBlur={handleBlur}
                onFocus={handleFocus}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
    </div>
  );
}

function CheckboxesWidget(props: WidgetProps) {
  const {
    id,
    htmlName,
    options,
    value,
    disabled,
    readonly,
    autofocus = false,
    onChange,
    onBlur,
    onFocus,
  } = props;
  const { inline = false, enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const values = Array.isArray(value) ? value : [value];

  const handleBlur = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder(target?.value, enumOptions, optionValueFormat, emptyValue));
  const handleFocus = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder(target?.value, enumOptions, optionValueFormat, emptyValue));

  return (
    <div id={id} className={inline ? 'flex flex-wrap gap-x-4 gap-y-1.5' : 'space-y-1.5'}>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index) => {
          const checked = enumOptionsIsSelected(option.value, values);
          const itemDisabled =
            (Array.isArray(enumDisabled) && enumDisabled.includes(option.value)) ||
            disabled ||
            readonly;
          const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            if (event.target.checked) {
              onChange(enumOptionsSelectValue(index, values, enumOptions));
            } else {
              onChange(enumOptionsDeselectValue(index, values, enumOptions));
            }
          };
          return (
            <label
              key={String(option.value)}
              className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
            >
              <input
                type="checkbox"
                id={optionId(id, index)}
                name={htmlName || id}
                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={checked}
                value={enumOptionValueEncoder(option.value, index, optionValueFormat)}
                disabled={itemDisabled}
                autoFocus={autofocus && index === 0}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
    </div>
  );
}

function FieldLabel({
  label,
  required,
  id,
}: {
  label?: string;
  required?: boolean;
  id?: string;
}) {
  if (!label) {
    return null;
  }
  return (
    <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

function FieldTemplate(props: FieldTemplateProps) {
  const {
    id,
    label,
    children,
    errors,
    help,
    description,
    hidden,
    required,
    displayLabel,
    registry,
    uiSchema,
    schema,
    rawErrors,
  } = props;

  if (hidden) {
    return <div className="hidden">{children}</div>;
  }
  // Przypadki additionalProperties (podmiana klucza / usunięcie pola) zostają
  // przy domyślnym szablonie - tamten markup jest bootstrapowy, ale działa.
  if (ADDITIONAL_PROPERTY_FLAG in schema) {
    const WrapIfAdditionalTemplate = registry.templates.WrapIfAdditionalTemplate;
    return <WrapIfAdditionalTemplate {...props} />;
  }

  const isCheckbox = getUiOptions(uiSchema).widget === 'checkbox';
  const hasError = !!rawErrors && rawErrors.length > 0;

  return (
    <div className={`space-y-1 ${hasError ? 'has-error' : ''}`}>
      {displayLabel && !isCheckbox && <FieldLabel label={label} required={required} id={id} />}
      {displayLabel && description ? description : null}
      {children}
      {errors}
      {help}
    </div>
  );
}

function ObjectFieldTemplate(props: ObjectFieldTemplateProps) {
  const {
    className,
    description,
    disabled,
    formData,
    fieldPathId,
    onAddProperty,
    properties,
    readonly,
    registry,
    required,
    schema,
    title,
    uiSchema,
  } = props;
  const { TitleFieldTemplate, DescriptionFieldTemplate } = registry.templates;
  const isPureUnionSchema = (schema.oneOf || schema.anyOf) && !schema.properties;
  if (isPureUnionSchema && properties.length === 0) {
    return null;
  }
  const { ButtonTemplates } = registry.templates;

  return (
    <fieldset className={`${className ?? ''} space-y-3`}>
      {title && (
        <TitleFieldTemplate
          id={titleId(fieldPathId)}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {description && (
        <DescriptionFieldTemplate
          id={descriptionId(fieldPathId)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {properties.map((prop) => prop.content)}
      {canExpand(schema, uiSchema, formData) && (
        <ButtonTemplates.AddButton
          id={buttonId(fieldPathId, 'add')}
          className="rjsf-object-property-expand"
          onClick={onAddProperty}
          disabled={disabled || readonly}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
    </fieldset>
  );
}

function TitleFieldTemplate(props: TitleFieldProps) {
  const { id, title, required } = props;
  if (!title) {
    return null;
  }
  return (
    <legend
      id={id}
      className="block text-xs font-semibold text-slate-900 border-b border-slate-100 pb-1"
    >
      {title}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </legend>
  );
}

function DescriptionFieldTemplate(props: DescriptionFieldProps) {
  const { id, description, registry, uiSchema } = props;
  if (!description) {
    return null;
  }
  return (
    <div id={id} className="text-[11px] leading-relaxed text-slate-500">
      <RichDescription description={description} registry={registry} uiSchema={uiSchema} />
    </div>
  );
}

function FieldErrorTemplate(props: FieldErrorProps) {
  const { errors = [], fieldPathId } = props;
  if (errors.length === 0) {
    return null;
  }
  return (
    <ul
      id={errorId(fieldPathId)}
      className="mt-1 space-y-0.5 text-[11px] text-rose-600 list-disc list-inside"
    >
      {errors
        .filter((elem) => !!elem)
        .map((error, index) => (
          <li key={index}>{error}</li>
        ))}
    </ul>
  );
}

function FieldHelpTemplate(props: FieldHelpProps) {
  const { fieldPathId, help, registry, uiSchema } = props;
  if (!help) {
    return null;
  }
  return (
    <div id={helpId(fieldPathId)} className="text-[11px] text-slate-400">
      <RichHelp help={help as string} registry={registry} uiSchema={uiSchema} />
    </div>
  );
}

function ErrorListTemplate(props: ErrorListProps) {
  const { errors } = props;
  if (!errors.length) {
    return null;
  }
  return (
    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
      <p className="font-semibold mb-1">Formularz zawiera błędy</p>
      <ul className="list-disc list-inside space-y-0.5">
        {errors.map((error, index) => (
          <li key={index}>{error.stack}</li>
        ))}
      </ul>
    </div>
  );
}

function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  const {
    canAdd,
    className,
    disabled,
    fieldPathId,
    uiSchema,
    items,
    onAddClick,
    readonly,
    registry,
    required,
    schema,
    title,
  } = props;
  const uiOptions = getUiOptions(uiSchema);
  const { ArrayFieldDescriptionTemplate, ArrayFieldTitleTemplate, ButtonTemplates } =
    registry.templates;

  return (
    <fieldset className={`${className ?? ''} space-y-3`}>
      <ArrayFieldTitleTemplate
        fieldPathId={fieldPathId}
        title={uiOptions.title || title}
        required={required}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
      <ArrayFieldDescriptionTemplate
        fieldPathId={fieldPathId}
        description={uiOptions.description || schema.description}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
      <div className="space-y-3">{items}</div>
      {canAdd && (
        <ButtonTemplates.AddButton
          id={buttonId(fieldPathId, 'add')}
          className="rjsf-array-item-add"
          onClick={onAddClick}
          disabled={disabled || readonly}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
    </fieldset>
  );
}

function ArrayFieldItemTemplate(props: ArrayFieldItemTemplateProps) {
  const { children, className, buttonsProps, hasToolbar, displayLabel, registry, uiSchema } = props;
  const { ArrayFieldItemButtonsTemplate } = registry.templates;

  return (
    <div className={`flex items-start gap-2 ${className ?? ''}`}>
      <div className={hasToolbar ? 'flex-1 min-w-0' : 'w-full'}>{children}</div>
      {hasToolbar && (
        <div className={`flex shrink-0 items-center gap-1 ${displayLabel ? 'pt-5' : 'pt-1'}`}>
          <ArrayFieldItemButtonsTemplate {...buttonsProps} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Przyciski                                                          */
/* ------------------------------------------------------------------ */

function ToolButton(props: IconButtonProps & { icon: string; label: string }) {
  const { id, className, onClick, disabled, label, icon, iconType } = props;
  const danger = iconType === 'danger';
  return (
    <button
      type="button"
      id={id}
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`${TOOL_BTN} ${danger ? TOOL_BTN_DANGER : ''} ${className ?? ''}`}
    >
      <Icon icon={icon} className="h-4 w-4" />
    </button>
  );
}

const AddButton = (props: IconButtonProps) => {
  const { onClick, disabled, id, className } = props;
  const label = 'Dodaj';
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors ${className ?? ''}`}
    >
      <Icon icon="mdi:plus" className="h-3.5 w-3.5" />
      {label}
    </button>
  );
};

const SubmitButton = ({ uiSchema }: SubmitButtonProps) => {
  const { submitText, norender, props: submitButtonProps = {} } = getSubmitButtonOptions(uiSchema);
  if (norender) {
    return null;
  }
  const text = submitText === 'Submit' ? 'Wyślij' : submitText;
  const { className, ...rest } = submitButtonProps;
  return (
    <button
      type="submit"
      {...rest}
      className={`px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 shadow-xs ${className ?? ''}`}
    >
      {text}
    </button>
  );
};

const buttonTemplates = {
  SubmitButton,
  AddButton,
  CopyButton: (props: IconButtonProps) => (
    <ToolButton {...props} icon="mdi:content-copy" label="Kopiuj element" />
  ),
  MoveUpButton: (props: IconButtonProps) => (
    <ToolButton {...props} icon="mdi:arrow-up" label="Przesuń wyżej" />
  ),
  MoveDownButton: (props: IconButtonProps) => (
    <ToolButton {...props} icon="mdi:arrow-down" label="Przesuń niżej" />
  ),
  RemoveButton: (props: IconButtonProps) => (
    <ToolButton {...props} icon="mdi:delete-outline" label="Usuń element" />
  ),
  ClearButton: (props: IconButtonProps) => (
    <ToolButton {...props} icon="mdi:close" label="Wyczyść pole" />
  ),
};

type FormTemplates = NonNullable<React.ComponentProps<typeof Form>['templates']>;
type FormWidgets = NonNullable<React.ComponentProps<typeof Form>['widgets']>;

export const templates: FormTemplates = {
  BaseInputTemplate,
  FieldTemplate,
  ObjectFieldTemplate,
  TitleFieldTemplate,
  DescriptionFieldTemplate,
  FieldErrorTemplate,
  FieldHelpTemplate,
  ErrorListTemplate,
  ArrayFieldTemplate,
  ArrayFieldItemTemplate,
  ButtonTemplates: buttonTemplates,
};

export const widgets: FormWidgets = {
  TextareaWidget,
  SelectWidget,
  CheckboxWidget,
  RadioWidget,
  CheckboxesWidget,
  // Pola migrowane z Webcona ze źródłem dynamicznym (zob.
  // widgets/AsyncSelectWidget.tsx).
  AsyncSelectWidget,
  TreeSelectWidget,
  // zwykły tekst wieloliniowy
  richtext: TextareaWidget,
};

export const defaultTemplates = getDefaultRegistry().templates;
