export default function UploadPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-stone px-5 text-ink">
      <section className="flex w-full max-w-xl flex-col items-center text-center">
        <h1 className="font-serif text-5xl font-light tracking-normal text-ink sm:text-6xl">
          Upload
        </h1>

        <p className="mt-4 max-w-md text-lg font-light leading-8 text-muted">
          Add a clear photo of your handwriting to begin.
        </p>

        <label
          className="mt-12 flex w-full cursor-pointer flex-col items-center border border-indigo bg-linen px-8 py-12 text-center hover:bg-periwinkle"
          htmlFor="handwriting-upload"
        >
          <span className="font-serif text-3xl font-light text-ink">
            Choose image
          </span>
          <span className="mt-3 text-sm font-medium text-indigo">
            .jpg or .png
          </span>
        </label>
        <input
          accept="image/jpeg,image/png"
          className="sr-only"
          id="handwriting-upload"
          type="file"
        />
      </section>
    </main>
  );
}
