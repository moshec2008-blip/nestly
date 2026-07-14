import type { ReactNode } from "react";
import { cn } from "./uiStyles";

type FormFieldProps = {
  label: string;
  children: ReactNode;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  className?: string;
};

export default function FormField({
  label,
  children,
  helperText,
  errorText,
  required = false,
  className = "",
}: FormFieldProps) {
  return (
    <div className={cn("block text-right", className)}>
      <span className="mb-1.5 flex items-center justify-end gap-1 text-xs font-black text-slate-700">
        {required ? (
          <span className="text-rose-600" aria-hidden="true">
            *
          </span>
        ) : null}
        <span>{label}</span>
      </span>
      {children}
      {errorText ? (
        <span className="mt-1.5 block text-xs font-bold leading-5 text-rose-700">
          {errorText}
        </span>
      ) : helperText ? (
        <span className="mt-1.5 block text-xs font-semibold leading-5 text-slate-500">
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
