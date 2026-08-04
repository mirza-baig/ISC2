import { FieldValues, useController, UseControllerProps } from 'react-hook-form';
import { ChangeEvent, useCallback } from 'react';
import clsx from 'clsx';
 
import { QuestionIcon } from 'icons/index';
import { useFormFields } from 'providers/index';
import { PoAttachment } from 'types/index';
 
import Tooltip from './Tooltip';
 
export namespace FormFileInput {
  export type Props<T extends FieldValues> = UseControllerProps<T> & {
    label: string;
    isOptional?: boolean;
    tooltipText?: string;
    accept?: string;
  };
}
 
const STYLES =
  'border disabled:!bg-input-disabled disabled:!opacity-100 disabled:!text-black border-black h-13 rounded-lg w-full text-gray-70 px-3 body-s outline-isc2-green focus:ring-isc2-green focus:border-isc2-green file:mr-3 file:my-2 file:rounded-lg file:border-0 file:bg-gray-10 file:px-3 file:py-1 file:body-s file:text-black file:cursor-pointer';
 
const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
 
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
 
/** File picker whose form value is `{ fileName, base64 }`, mirroring PhotoSchema. */
export function FormFileInput<T extends FieldValues>({
  name,
  label,
  control,
  isOptional,
  tooltipText,
  disabled,
  accept,
}: FormFileInput.Props<T>) {
  const { requiredText, getFieldErrorMessage } = useFormFields();
 
  const {
    field: { value, onChange, ...rest },
    fieldState: { error },
  } = useController({ control, name });
 
  const onFileSelected = useCallback(
    async (ev: ChangeEvent<HTMLInputElement>) => {
      if (disabled) {
        return;
      }
 
      const file = ev.target.files?.[0];
 
      if (!file) {
        onChange(undefined);
        return;
      }
 
      const base64 = await readFileAsDataUrl(file);
 
      onChange({ fileName: file.name, base64 });
    },
    [onChange, disabled]
  );
 
  const errorMessage = getFieldErrorMessage({ field: label, error });
  const hasTooltip = Boolean(tooltipText);
  const selectedFileName = (value as PoAttachment | undefined)?.fileName;
 
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <label className="text-black body-s" htmlFor={name} aria-label={label}>
          {label}
        </label>
        {(hasTooltip || !isOptional) && (
          <span className="flex items-center text-gray-70 body-s !text-xxs">
            {hasTooltip && (
              <Tooltip
                Component={<QuestionIcon size={18} className="text-isc2-green" />}
                content={tooltipText!}
                position="left"
                className="w-52 text-center"
              />
            )}
 
            {!isOptional && requiredText}
          </span>
        )}
      </div>
      <input
        {...rest}
        type="file"
        id={name}
        accept={accept}
        className={clsx(
          STYLES,
          errorMessage && '!border-red-warning !border-2 focus:!ring-transparent'
        )}
        disabled={disabled}
        onChange={onFileSelected}
      />
      {Boolean(selectedFileName) && (
        <label className="text-gray-70 body-s mt-1 block">{selectedFileName}</label>
      )}
      <label className="text-red-warning body-s font-semibold mt-2">{errorMessage}</label>
    </div>
  );
}