import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonTone = "primary" | "secondary" | "ghost";

const tones: Record<ButtonTone, string> = {
  primary:
    "bg-[#007aff] text-white shadow-[0_10px_22px_rgba(0,122,255,0.18)] hover:bg-[#006ee6]",
  secondary:
    "border border-[#e6e8ec] bg-white text-[#1d1d1f] shadow-sm hover:bg-[#fafafb]",
  ghost: "text-slate-600 hover:bg-[#fafafb] hover:text-[#1d1d1f]",
};

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-black transition duration-200 hover:-translate-y-0.5";

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
      className={`${baseClass} ${tones[tone]} ${className}`}
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
      className={`${baseClass} ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
