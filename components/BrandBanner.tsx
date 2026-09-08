import Image from "next/image";
import Link from "next/link";

export default function BrandBanner() {
  return (
    <section className="relative overflow-hidden py-8 md:py-14 border-y border-[#EAEAEA] bg-gradient-to-b from-white via-[#FAF9F6] to-white">
      {/* Subtle ambient glow elements */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[450px] h-[450px] rounded-full bg-[#D4AF37]/5 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#D4AF37]/5 blur-[140px]" />

      <div className="max-w-wrap mx-auto px-5 sm:px-8 w-full relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          
          {/* Left Column: High-End Editorial Copy & CTAs (7 cols on Desktop) */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#D4AF37]/30 shadow-sm mb-6 sm:mb-8">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="font-display font-bold text-xs tracking-[0.2em] text-[#C5A059] uppercase">
                ELITE HIJAB™ &bull; LUXURY EDIT
              </span>
            </div>

            {/* Main Headline */}
            <h2 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-ink leading-[1.08] tracking-tight max-w-2xl">
              Where Modesty <br className="hidden sm:block" />
              Meets <span className="italic font-normal gradient-gold-text">Timeless Elegance</span>
            </h2>

            {/* Decorative separator */}
            <div className="flex items-center gap-3 my-6 sm:my-8 w-full max-w-md justify-center lg:justify-start">
              <div className="h-[2px] w-16 sm:w-24 bg-gradient-to-r from-gold to-transparent" />
              <span className="text-gold text-sm tracking-widest uppercase font-display font-semibold">✦ 2026 Collection ✦</span>
              <div className="h-[2px] w-16 sm:w-24 bg-gradient-to-l from-gold to-transparent" />
            </div>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-ink/80 font-body max-w-xl leading-relaxed">
              Experience the perfect fusion of tradition and contemporary haute couture. Handcrafted with ultra-breathable pure silks, fluid chiffons, and intricate handwork designed for grace.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-5 w-full sm:w-auto">
              <Link
                href="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-9 py-4 rounded-full bg-[#0A0A0A] text-white border border-[#D4AF37]/50 font-body font-semibold text-[15px] tracking-wide shadow-card hover:bg-[#D4AF37] hover:text-[#0A0A0A] transition-all duration-300 hover:scale-[1.03]"
              >
                <span>Shop The Collection</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            {/* Trust Metrics / Highlights */}
            <div className="mt-12 sm:mt-14 pt-8 border-t border-[#D4AF37]/20 grid grid-cols-3 gap-4 sm:gap-8 w-full max-w-lg">
              <div className="text-center lg:text-left">
                <p className="font-display font-bold text-2xl sm:text-3xl text-ink">50,000+</p>
                <p className="text-xs sm:text-sm text-ink/70 font-medium mt-1">Happy Customers</p>
              </div>
              <div className="text-center lg:text-left border-x border-[#D4AF37]/20 px-3 sm:px-4">
                <p className="font-display font-bold text-2xl sm:text-3xl text-[#C5A059]">100%</p>
                <p className="text-xs sm:text-sm text-ink/70 font-medium mt-1">Pure Silk &amp; Chiffon</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="font-display font-bold text-2xl sm:text-3xl text-[#D4AF37]">4.9 ★</p>
                <p className="text-xs sm:text-sm text-ink/70 font-medium mt-1">Global Rating</p>
              </div>
            </div>

          </div>

          {/* Right Column: 3D Multi-Layered Floating Collage (Shuffled Images) */}
          <div className="lg:col-span-5 relative w-full pt-6 sm:pt-8 lg:pt-0">
            
            {/* Main Portrait Card (Shuffled to img_05.webp) */}
            <div className="relative w-full h-[420px] sm:h-[520px] lg:h-[560px] rounded-[32px] sm:rounded-[40px] overflow-hidden shadow-2xl border-[4px] border-white bg-cream-deep group">
              <Image
                src="/assets/images/img_05.webp"
                alt="Elite Hijab Luxury Modest Wear"
                fill
                sizes="(max-width: 1024px) 100vw, 550px"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-60 pointer-events-none" />
            </div>

            {/* Floating Inset Frame (Shuffled to img_04.webp) */}
            <div className="absolute -bottom-6 -left-4 sm:-left-8 w-[160px] sm:w-[220px] h-[200px] sm:h-[260px] rounded-[24px] sm:rounded-[32px] overflow-hidden border-[4px] border-white shadow-2xl bg-cream hidden sm:block animate-floatSlow z-20 group">
              <Image
                src="/assets/images/img_04.webp"
                alt="Intricate Handwork Details"
                fill
                sizes="220px"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-center shadow-sm border border-[#D4AF37]/30">
                <span className="text-[11px] font-display font-semibold text-[#D4AF37] tracking-wider uppercase block">Handwork Luxe</span>
              </div>
            </div>

            {/* Floating Glassmorphic Badge (Top Right) */}
            <div className="absolute -top-2 right-2 sm:top-0 sm:-right-0 md:-top-[20px] bg-white/95 backdrop-blur-md px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl border border-[#D4AF37]/25 shadow-xl flex items-center gap-2.5 sm:gap-3 z-30 transition-transform duration-300 hover:scale-105">
              <div className="w-8 h-8 rounded-full bg-[#0A0A0A] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold text-sm">
                ✨
              </div>
              <div>
                <p className="font-display font-bold text-xs sm:text-sm text-ink leading-tight">Haute Couture</p>
                <p className="text-[11px] text-ink/70">Fluid Drapes &amp; Zero Slip</p>
              </div>
            </div>

            {/* Floating Rating Card (Bottom Right) */}
            <div className="absolute bottom-6 right-4 sm:-right-4 bg-[#0A0A0A]/95 backdrop-blur-md text-white px-4 sm:px-5 py-3 rounded-2xl border border-[#D4AF37]/40 shadow-2xl flex items-center gap-3 z-30 transition-transform duration-300 hover:scale-105">
              <div className="flex text-[#D4AF37] text-sm">
                ★★★★★
              </div>
              <span className="text-xs sm:text-sm font-semibold tracking-wide">Loved by 12k+ Women</span>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
