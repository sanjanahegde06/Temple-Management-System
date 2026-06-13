import type { ChangeEvent, FocusEvent } from "react";

type FormFieldProps = {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  value: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
};

export default function FormField({
  label,
  name,
  type = "text",
  value,
  placeholder,
  autoComplete,
  error,
  disabled,
  onChange,
  onBlur,
}: FormFieldProps) {
  const inputId = `field-${name}`;
  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-semibold text-amber-950">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${inputId}-error` : undefined}
        className={`h-12 w-full rounded-xl border px-4 text-sm text-amber-950 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-amber-50/60 ${
          hasError
            ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-200"
            : "border-amber-200 bg-white"
        }`}
      />
      <p
        id={`${inputId}-error`}
        aria-hidden={!hasError}
        className={`text-xs font-medium text-red-600 ${
          hasError ? "opacity-100" : "opacity-0"
        }`}
      >
        {error ?? "placeholder"}
      </p>
    </div>
  );
}
