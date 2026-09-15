import { useId } from "react";

interface FormFieldProps {
  label: string;
  placeholder?: string;
  optional?: boolean;
  multiline?: boolean;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
}

/** Large labelled form field with generous text and tap area. */
export function FormField({
  label,
  placeholder,
  optional,
  multiline,
  type = "text",
  value,
  onChange,
}: FormFieldProps) {
  const id = useId();
  const inputClass =
    "w-full rounded-2xl border-2 border-input bg-card px-4 py-4 text-xl font-semibold text-foreground placeholder:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-lg font-bold text-foreground">
        {label}
        {optional ? (
          <span className="ml-2 text-base font-semibold text-muted-foreground">
            (optional)
          </span>
        ) : null}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={3}
          placeholder={placeholder}
          className={inputClass}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          className={inputClass}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )}
    </div>
  );
}
