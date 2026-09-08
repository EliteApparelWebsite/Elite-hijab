"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Reveal from "./Reveal";
import { useCart } from "@/context/CartContext";

interface Product {
  id: string;
  slug?: string;
  name: string;
  image_url: string;
  badge?: string;
  rating?: number;
  price: number;
  oldPrice?: number;
  colorCount?: number;
  reviewCount?: number;
}

function formatINR(n: number) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
}

export default function LuxeSalwarKameez({ products = [] }: { products?: Product[] }) {
  const { addToCart } = useCart();
  const router = useRouter();

  if (products.length === 0) return null;

  return (
    <section id="luxe-salwar-kameez" className="relative py-8 md:py-14 bg-white border-b border-[#EAEAEA]">
      <div className="max-w-wrap mx-auto px-5 md:px-8">
        <Reveal className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#D4AF37]/50 shadow-sm mb-3">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="font-display font-bold text-xs tracking-[0.22em] text-[#AA8034] uppercase">
              NEW ARRIVAL
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mt-2 text-[#0A0A0A]">
            The <span className="italic text-[#AA8034] font-serif font-medium">Luxe</span> Salwar Kameez Edit
          </h2>
          <p className="mt-3 text-[#555555] text-sm md:text-base leading-relaxed">
            Exquisite embroidery, premium lawn and chikankari — a curated edit
            for those who love a statement suit.
          </p>
        </Reveal>

        <div className="mt-12 flex flex-wrap justify-center gap-4 md:gap-6">
          {products.slice(0, 4).map((p, i) => (
            <Reveal key={p.id} delay={(i % 5) as any} className="flex-none w-[calc(50%-0.5rem)] md:w-[calc(34.833%-1rem)] lg:w-[calc(21.5%-1.2rem)]">
              <div className="lift group bg-white rounded-2xl md:rounded-[22px] p-3 md:p-3.5 shadow-card hover:shadow-[0_15px_35px_rgba(212,175,55,0.2)] border border-[#D4AF37]/35 hover:border-[#D4AF37] h-full flex flex-col transition-all duration-300">
                <div className="relative aspect-[4/4.3] rounded-xl bg-cream-deep/20 block shrink-0 overflow-hidden">
                  <Link href={`/shop/${p.slug || p.id}`} className="absolute inset-0 overflow-hidden rounded-xl z-0">
                    <Image
                      src={p.image_url || (p as any).image || "/luxe-salwar-kameez.png"}
                      alt={p.name || "Salwar Kameez"}
                      fill
                      sizes="(max-width: 768px) 50vw, 320px"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                    />
                  </Link>
                  {p.badge && (
                    <span className="absolute top-2 right-2 z-10 bg-[#0A0A0A] text-[#D4AF37] border border-[#D4AF37]/50 text-[9px] md:text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-md pointer-events-none">
                      {p.badge}
                    </span>
                  )}
                </div>
                <div className="flex flex-col flex-1 pt-3 px-0.5">
                  <div className="flex-1">
                    <Link href={`/shop/${p.slug || p.id}`} className="hover:text-[#AA8034] transition-colors block">
                      <h3 className="font-display font-bold text-[#0A0A0A] text-[14px] md:text-[15.5px] leading-snug line-clamp-2">
                        {p.name}
                      </h3>
                    </Link>
                    {p.colorCount && p.colorCount > 1 && (
                      <p className="mt-1 text-[11px] font-semibold text-[#AA8034]">
                        {p.colorCount} colors available
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-display font-extrabold text-[#0A0A0A] text-[16px] md:text-[17px]">
                      {formatINR(p.price)}
                    </span>
                    {p.oldPrice && (
                      <span className="text-ink/40 text-[12.5px] md:text-[13px] line-through font-normal">
                        {formatINR(p.oldPrice)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <div className="flex items-center text-[#D4AF37] text-[13px] tracking-tight gap-0.5">
                      {"★".repeat(5)}
                    </div>
                    <span className="text-ink/55 text-[12px] font-medium">
                      ({p.reviewCount ?? 0})
                    </span>
                  </div>
                  <div className="mt-3.5 grid grid-cols-1 gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart({
                          id: p.id,
                          name: p.name,
                          price: p.price,
                          image_url: p.image_url,
                          category_name: "Luxe Salwar Kameez",
                        });
                      }}
                      className="w-full text-center rounded-xl border border-[#0A0A0A] bg-white text-black text-[13px] md:text-sm font-bold py-2.5 hover:bg-[#0A0A0A] hover:text-[#D4AF37] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <svg className="w-4 h-4 text-[#D4AF37] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span>Add to cart</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart({
                          id: p.id,
                          name: p.name,
                          price: p.price,
                          image_url: p.image_url,
                          category_name: "Luxe Salwar Kameez",
                        });
                        router.push("/checkout");
                      }}
                      className="w-full text-center rounded-xl bg-[#0A0A0A] text-white border border-[#D4AF37]/50 text-[13px] md:text-sm font-bold py-2.5 hover:bg-[#D4AF37] hover:text-[#0A0A0A] transition-all flex items-center justify-center shadow-md hover:shadow-[0_4px_15px_rgba(212,175,55,0.3)]"
                    >
                      <span>Buy now</span>
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 text-center">
          <Link
            href="/shop?category=salwar_kameez"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[#0A0A0A] text-white border border-[#D4AF37]/50 font-body font-semibold text-[15px] tracking-wide shadow-card hover:bg-[#D4AF37] hover:text-[#0A0A0A] transition-all"
          >
            Shop The Luxe Edit
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
