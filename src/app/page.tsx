import { Cormorant } from "next/font/google";

const cormorant = Cormorant({
  subsets: ["latin"],
  display: "swap",
  style: "italic",
});

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className={`${cormorant.className} text-5xl italic`}>HandWrite</h1>
    </main>
  );
}
