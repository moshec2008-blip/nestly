import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import {
  buttonBaseClass,
  buttonSizeClasses,
  buttonToneClasses,
  cn,
} from "./uiStyles";

type ButtonTone = keyof typeof buttonToneClasses;
type ButtonSize = keyof typeof buttonSizeClasses;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: ButtonTone;
  size?: ButtonSize;
  loading?: boolean;
};

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href: string;
  tone?: ButtonTone;
  size?: ButtonSize;
};

export function Button({
  children,
  tone = "secondary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        buttonBaseClass,
        buttonSizeClasses[size],
        buttonToneClasses[tone],
        className
      )}
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span
          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  href,
  tone = "secondary",
  size = "md",
  className = "",
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        buttonBaseClass,
        buttonSizeClasses[size],
        buttonToneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
