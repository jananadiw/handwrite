export function UploadCollectionConsent({
  checked,
  disabled,
  id,
  onCheckedChange,
}: {
  checked: boolean;
  disabled?: boolean;
  id: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`mt-4 flex items-start gap-3 px-4 py-3 ring-1 ring-ink/8 ${
        disabled ? "opacity-60" : "cursor-pointer hover:ring-ink/14"
      }`}
      htmlFor={id}
    >
      <input
        checked={checked}
        className="peer sr-only"
        disabled={disabled}
        id={id}
        onChange={(event) => onCheckedChange(event.target.checked)}
        type="checkbox"
      />
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-ink/20 bg-stone text-sm font-medium leading-none text-transparent peer-checked:border-button peer-checked:bg-button peer-checked:text-stone"
      >
        ✓
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-5 text-ink">
          Save my photo to improve HandWrite
        </span>
        <span className="mt-0.5 block text-xs font-light leading-5 text-subtitle">
          Only this image is collected.
        </span>
      </span>
    </label>
  );
}
