import Reveal from "./Reveal";
import BotanicalDivider from "./BotanicalDivider";
import { IconFabric, IconNeedle, IconTulip, IconWing } from "./Icons";
import { usps } from "@/lib/data";

const icons = [IconFabric, IconNeedle, IconTulip, IconWing];

export default function WhyUs() {
  return (
    <section className="relative py-12 md:py-20 bg-[#FAFAF8] overflow-hidden border-y border-[#EAEAEA]">
      {/* Subtle champagne warmth */}
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-[420px] h-[420px] rounded-full bg-[#D4AF37]/8 blur-3xl" />
      <div className="pointer-events-none absolute -top-20 right-0 w-[360px] h-[360px] rounded-full bg-[#D4AF37]/8 blur-3xl" />

      <div className="max-w-wrap mx-auto px-5 md:px-8 relative">
        <Reveal className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-[#D4AF37]/50 shadow-sm mb-3">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="font-display font-bold text-xs tracking-[0.25em] text-[#AA8034] uppercase">
              WHY ELITE HIJAB
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mt-3 text-[#0A0A0A]">
            Crafted with the same care, every time.
          </h2>
          <p className="text-[#555555] text-sm md:text-base mt-3 max-w-md mx-auto leading-relaxed">
            Experience our uncompromising commitment to pure fabric, flawless modest drapes, and timeless beauty.
          </p>
        </Reveal>

        <div className="mt-12 md:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {usps.map((item, i) => {
            const Icon = icons[i % icons.length];
            return (
              <Reveal key={item.title} delay={(i % 4) as 0 | 1 | 2 | 3}>
                <div className="h-full bg-white border border-[#E8E8E8] hover:border-[#D4AF37] rounded-2xl md:rounded-[24px] p-6 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_35px_rgba(212,175,55,0.18)] transition-all duration-300 hover:-translate-y-2 group">
                  <div className="h-12 w-12 md:h-14 md:w-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 bg-[#FAF6EC] border border-[#D4AF37]/50 text-[#AA8034] group-hover:bg-[#D4AF37] group-hover:text-black shadow-sm">
                    <Icon className="w-6 h-6 md:w-7 md:h-7 transition-colors" />
                  </div>
                  <h3 className="font-display font-bold text-[#0A0A0A] text-lg mt-5 transition-colors group-hover:text-[#AA8034]">
                    {item.title}
                  </h3>
                  <p className="text-[#666666] text-[13px] md:text-sm mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
      <div className="relative mt-14">
        <BotanicalDivider tone="gold" />
      </div>
    </section>
  );
}
