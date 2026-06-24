export function UploadLimitNotice() {
  return (
    <div className="mt-5 grid grid-cols-[44px_1fr] gap-3 bg-stone px-4 py-4 shadow-[0_10px_28px_rgba(43,38,34,0.06)]">
      <div className="flex h-11 w-11 items-center justify-center bg-linen font-serif text-2xl font-bold text-ink">
        3
      </div>
      <div>
        <h2 className="text-sm font-medium leading-5 text-ink">
          You can analyze up to 3 photos on this network
        </h2>
        <p className="mt-1 text-sm font-light leading-5 text-muted">
          Choose your clearest alphabet photos before analyzing. Invalid files
          do not count toward the limit.
        </p>
      </div>
    </div>
  );
}
