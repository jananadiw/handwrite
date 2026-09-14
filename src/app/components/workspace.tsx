import Link from "next/link";
import type { ReactNode } from "react";

export const workspacePageClass =
  "paper-grid h-dvh overflow-hidden overscroll-none px-4 py-6 text-ink sm:px-8 sm:py-10";
export const workspacePanelClass =
  "flex max-h-full w-full flex-col bg-stone/95 shadow-[0_18px_50px_rgba(43,38,34,0.08)] ring-1 ring-ink/[0.06] backdrop-blur-[2px]";
export const workspaceContentClass =
  "min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-y-contain px-5 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-inset sm:px-8 sm:py-7";
export const workspaceSectionClass =
  "mx-auto flex h-full min-h-0 w-full max-w-[680px] items-start justify-center";

export function WorkspaceHeader({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-4">
      <Link
        aria-label="HandWrite home"
        className="inline-flex min-h-11 items-center font-serif text-xl font-bold italic tracking-[-0.02em] text-title transition-colors hover:text-subtitle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-4"
        href="/"
      >
        HandWrite
      </Link>
      <Link
        className="inline-flex min-h-11 items-center text-sm font-medium text-subtitle underline decoration-ink/25 underline-offset-4 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-2"
        href={href}
      >
        {children}
      </Link>
    </header>
  );
}

export function WorkspaceIntro({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mt-8 text-left sm:mt-10">
      <h1 className="max-w-[600px] font-serif text-[36px] font-bold italic leading-[1.12] tracking-[-0.025em] text-title sm:text-[46px]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 max-w-[480px] text-base leading-7 text-subtitle">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export const workspaceFooterClass =
  "shrink-0 bg-stone px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-7";
