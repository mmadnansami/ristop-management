import { useEffect, useState } from "react";

type Slide = { src: string; alt: string; href: string };

const SLIDES: Slide[] = [
  {
    src: "/ristop-banner.jpg",
    alt: "Ristop Management — understand your business",
    href: "#features",
  },
  {
    src: "/ristop-banner-ai.jpg",
    alt: "Ris AI — your 24/7 business assistant",
    href: "#features",
  },
  {
    src: "/ristop-banner-offer.jpg",
    alt: "52% launch discount on all Ristop plans",
    href: "#pricing",
  },
];

/** Slim, ad-style banner strip that auto-swaps between promos. */
export function AdBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full border-b border-primary/30 bg-background">
      <div className="relative h-20 w-full overflow-hidden sm:h-24 md:h-28">
        {SLIDES.map((s, i) => (
          <a
            key={s.src}
            href={s.href}
            aria-label={s.alt}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
            className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <img
              src={s.src}
              alt={s.alt}
              width={1920}
              height={800}
              className="h-full w-full object-cover object-center"
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </a>
        ))}
      </div>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.src}
            type="button"
            aria-label={`Show promo ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-primary-foreground" : "w-1.5 bg-primary-foreground/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
