import Image from "next/image";
import Link from "next/link";

export default function PakistaniEditBanner() {
  return (
    <section 
      className="relative overflow-hidden py-12 md:py-20 border-y border-[#EAEAEA] min-h-[480px] flex items-center bg-[#FAFAF8]"
    >
      {/* Subtle ambient champagne gold glow */}
      <div className="pointer-events-none absolute top-1/2 -left-32 w-[450px] h-[450px] rounded-full bg-[#D4AF37]/8 blur-[130px] -translate-y-1/2" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#D4AF37]/8 blur-[120px]" />

      <div className="max-w-wrap mx-auto px-5 md:px-8 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* Left Column: Premium 4-Image Masonry Grid (Positions Shuffled) */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-5 order-2 lg:order-1 w-full h-[450px] md:h-[550px] lg:h-[600px]">
            <div className="flex flex-col gap-3 md:gap-4 lg:gap-5 h-full">
              <div className="relative w-full flex-grow rounded-[20px] md:rounded-[28px] overflow-hidden shadow-[0_12px_35px_rgba(0,0,0,0.08)] border-2 border-[#D4AF37]/40 group bg-white">
                <Image src="/assets/images/img_04.webp" alt="The Luxury Hijab & Accessories Edit 1" fill sizes="(max-width: 1024px) 50vw, 300px" className="object-cover object-top transition-all duration-700 group-hover:scale-[1.05]" />
              </div>
              <div className="relative w-full h-[35%] rounded-[20px] md:rounded-[28px] overflow-hidden shadow-[0_12px_35px_rgba(0,0,0,0.08)] border-2 border-[#D4AF37]/40 group bg-white">
                <Image src="/assets/images/img_03.jpg" alt="The Luxury Hijab & Accessories Edit 2" fill sizes="(max-width: 1024px) 50vw, 300px" className="object-cover object-center transition-all duration-700 group-hover:scale-[1.05]" />
              </div>
            </div>
            <div className="flex flex-col gap-3 md:gap-4 lg:gap-5 h-full pt-8 md:pt-12">
              <div className="relative w-full h-[40%] rounded-[20px] md:rounded-[28px] overflow-hidden shadow-[0_12px_35px_rgba(0,0,0,0.08)] border-2 border-[#D4AF37]/40 group bg-white">
                <Image src="/assets/images/img_05.webp" alt="The Luxury Hijab & Accessories Edit 3" fill sizes="(max-width: 1024px) 50vw, 300px" className="object-cover object-center transition-all duration-700 group-hover:scale-[1.05]" />
              </div>
              <div className="relative w-full flex-grow rounded-[20px] md:rounded-[28px] overflow-hidden shadow-[0_12px_35px_rgba(0,0,0,0.08)] border-2 border-[#D4AF37]/40 group bg-white">
                <Image src="/assets/images/img_02.webp" alt="The Luxury Hijab & Accessories Edit 4" fill sizes="(max-width: 1024px) 50vw, 300px" className="object-cover object-top transition-all duration-700 group-hover:scale-[1.05]" />
              </div>
            </div>
          </div>

          {/* Right Column: Brand Content and CTA (Centered) */}
          <div className="flex flex-col items-center text-center py-4 lg:py-6 justify-center order-1 lg:order-2">
            {/* Monogram Logo */}
            <div className="relative w-24 h-24 mb-6 rounded-2xl overflow-hidden shadow-md border-2 border-[#D4AF37]">
              <Image
                src="/Elitehijab-logo.jpeg"
                alt="Elite Hijab Logo"
                fill
                className="object-cover"
              />
            </div>

            {/* Brand Title */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#D4AF37]/50 shadow-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="font-display font-bold text-xs tracking-[0.22em] text-[#AA8034] uppercase">
                EXCLUSIVE COLLECTION
              </span>
            </div>

            {/* Cursive Subtitle */}
            <h2 className="font-display font-bold text-4xl md:text-5xl text-[#0A0A0A] leading-tight">
              The <span className="italic text-[#AA8034] font-serif font-medium">Signature</span> Hijab Collection
            </h2>
            
            <div className="w-24 h-[1.5px] bg-[#D4AF37] my-6" />

            {/* Main Subtitle */}
            <p className="text-base md:text-lg text-[#555555] font-body max-w-[440px] leading-relaxed">
             Premium chiffon, satin, cotton, jersey, and organza hijabs crafted for everyday elegance and special occasions. Explore timeless styles designed for comfort, modesty, and effortless sophistication.
            </p>

            {/* CTA Button */}
            <Link
              href="/shop"
              className="mt-8 inline-flex items-center justify-center px-10 py-4 rounded-full border-2 border-[#0A0A0A] bg-[#0A0A0A] text-white hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] font-body font-bold text-[14px] uppercase tracking-wider transition-all hover:scale-[1.02] shadow-md"
            >
              Shop Collection
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
