import type { ButtonHTMLAttributes } from "react";

type ActionVariant = "primary" | "secondary" | "text";

export function actionClass(variant: ActionVariant = "primary") {
  const base =
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-none px-3 text-sm font-medium transition-[background-color,color,transform] duration-150 enabled:active:translate-y-px disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:transform-none";
  const variants = {
    primary:
      "h-14 bg-button text-button-foreground shadow-[0_8px_24px_rgba(43,38,34,0.08)] hover:bg-button-hover disabled:bg-muted disabled:shadow-none",
    secondary:
      "h-14 bg-stone text-ink ring-1 ring-inset ring-ink/10 enabled:hover:bg-linen disabled:text-muted disabled:opacity-50",
    text: "min-h-11 text-subtitle enabled:hover:bg-linen enabled:hover:text-ink disabled:opacity-40",
  };
  return `${base} ${variants[variant]}`;
}

export function ActionButton({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ActionVariant }) {
  return (
    <button
      type="button"
      {...props}
      className={`${actionClass(variant)} ${className}`}
    />
  );
}
