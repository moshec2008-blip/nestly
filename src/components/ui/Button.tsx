import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { buttonBaseClass, buttonToneClasses, cn } from "./uiStyles";

type ButtonTone = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: ButtonTone;
};

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href: string;
  tone?: ButtonTone;
};

export function Button({
  children,
  tone = "secondary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonBaseClass, buttonToneClasses[tone], className)}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  href,
  tone = "secondary",
  className = "",
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(buttonBaseClass, buttonToneClasses[tone], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
