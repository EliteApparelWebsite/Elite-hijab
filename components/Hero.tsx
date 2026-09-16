"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { SITE } from "@/lib/data";
import HeroLineArt from "./HeroLineArt";
import MobileHeroCarousel from "./MobileHeroCarousel";
// import "../app/globals.css"


interface Slide {
  image_url: string;
  is_active: boolean;
  position?: string;
  title?: string;
  subtitle?: string;
}

export default function Hero({ 
  slides = [], 
  heroText 
}: { 
  slides?: Slide[]; 
  heroText?: { 
    heading_line1?: string; 
    heading_line2?: string; 
    heading_line3?: string; 
    description?: string; 
  } 
}) {
  const line1 = heroText?.heading_line1 || "A complete";
  const line2 = heroText?.heading_line2 || "modesty elegance";
  const line3 = heroText?.heading_line3 || "style";
  const desc = heroText?.description || "Premium Hijabs, Scarves & Modest Essentials crafted with luxurious fabric and effortless style.";

  // Load active hero slides from props
  const activeSlides = slides.filter((slide: any) => slide.is_active);
  
  const archImages = activeSlides.length > 0 
    ? activeSlides.map((slide: any) => slide.image_url)
    : [
        "/assets/images/img_01.jpeg",
        "/assets/images/img_02.webp",
        "/assets/images/img_03.jpg",
        "/assets/images/img_04.webp",
      ];

  const gridFallbackImages = [
    "/assets/images/img_05.webp",
    "/assets/images/img_06.webp",
    "/assets/images/img_07.webp",
    "/assets/images/img_08.webp",
  ];

  const allAvailableImages = activeSlides.map((s: any) => s.image_url).filter(Boolean);
  
  const gridImages = allAvailableImages.length > 0
    ? allAvailableImages.slice(0, 6)
    : [
        ...gridFallbackImages,
        "/assets/images/img_09.webp",
        "/assets/images/img_10.webp"
      ].slice(0, 6);

  const mobileCarouselImages = allAvailableImages.length > 0
    ? allAvailableImages
    : [
        "/assets/images/img_01.jpeg",
        "/assets/images/img_02.webp",
        "/assets/images/img_03.jpg",
        "/assets/images/img_04.webp",
        "/assets/images/img_05.webp",
        "/assets/images/img_06.webp",
        "/assets/images/img_07.webp",
        "/assets/images/img_08.webp"
      ];

  const [activeArchIndex, setActiveArchIndex] = useState(0);
  const [activeGridIndex, setActiveGridIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveArchIndex((prev) => (prev + 1) % archImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [archImages.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveGridIndex((prev) => (prev + 1) % gridImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [gridImages.length]);

  return (
    <section
      id="home heros"
      className="relative overflow-hidden pt-32 sm:pt-36 md:pt-40 lg:pt-28 pb-8 md:pb-12 bg-gradient-to-b from-[#FFFFFF] via-[#FAF9F6] to-[#FFFFFF] border-b border-[#EAEAEA]"
    >
      {/* Subtle ambient champagne gold glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-[radial-gradient(circle,_rgba(212,175,55,0.08)_0%,_transparent_70%)] blur-2xl z-0" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-transparent blur-3xl opacity-50 z-0" />
      <div className="pointer-events-none absolute top-1/3 -left-40 w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-[#D4AF37]/8 via-transparent to-transparent blur-3xl opacity-40 z-0" />

      <div className="max-w-wrap mx-auto px-4 sm:px-6 md:px-8 relative z-10 w-full">
        {/* Main Split Layout */}
        <div className="grid lg:grid-cols-[1fr_1.3fr] xl:grid-cols-[1fr_1.45fr] gap-6 sm:gap-8 lg:gap-10 xl:gap-14 items-center w-full">
          
          {/* Left Column: Brand Typography, CTAs, Sub-features */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left z-10 py-2 sm:py-4 w-full">
            
            {/* Subtitle / Eyebrow Badge in White & Gold */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-[#D4AF37]/50 shadow-[0_2px_12px_rgba(212,175,55,0.15)] mb-3 sm:mb-4">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="font-display font-bold text-xs sm:text-[13px] tracking-[0.25em] text-[#AA8034] uppercase">
                <span className="normal-case">Elite hijab</span> &amp; HIJAB ACCESSORIES
              </span>
            </div>

            {/* Mobile Main Heading */}
            <h1 className="block lg:hidden font-display font-bold text-[2.7rem] sm:text-4xl leading-[1.12] tracking-tight text-[#0A0A0A] w-full">
              {line1} <br />
              <span className="bg-gradient-to-r from-[#B38728] via-[#D4AF37] to-[#AA771C] bg-clip-text text-transparent italic font-serif">{line2}</span>{" "}
              <span className="text-[#0A0A0A]">{line3}</span>
            </h1>

            {/* Desktop Main Heading */}
            <h1 className="hidden lg:block font-display font-bold lg:text-[3.2rem] xl:text-[3.8rem] leading-[1.08] tracking-tight text-[#0A0A0A] heros-txt">
              {line1} <br />
              <span className="bg-gradient-to-r from-[#B38728] via-[#D4AF37] to-[#AA771C] bg-clip-text text-transparent italic font-serif ml-12 lg:ml-16">{line2}</span> <br />
              <span className="heros-you ml-20 lg:ml-28 text-[#0A0A0A] inline-block">{line3}</span>
            </h1>

            {/* Decorative Diamond Divider */}
            <div className="flex items-center gap-2.5 my-4 sm:my-5 w-52 sm:w-60 mx-auto lg:mx-0">
              <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-[#D4AF37]" />
              <div className="w-2 h-2 rotate-45 bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
              <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-[#D4AF37] to-[#D4AF37]" />
            </div>

            {/* Mobile Description Paragraph */}
            <p className="block lg:hidden text-sm sm:text-base text-[#4A4A4A] font-body max-w-[440px] leading-relaxed mx-auto">
              {desc}
            </p>

            {/* Desktop Description Paragraph */}
            <p className="hidden lg:block text-base lg:text-lg text-[#4A4A4A] font-body max-w-[460px] leading-relaxed">
              {desc}
            </p>

            {/* Mobile 3D Smooth Right-to-Left Carousel */}
            <MobileHeroCarousel images={mobileCarouselImages} speed={1.20} />

            {/* CTA Buttons - High-end Gold, Black and White */}
            <div className="mt-4 sm:mt-6 lg:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full max-w-[360px] sm:max-w-none mx-auto lg:mx-0">
              <a
                href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                  SITE.whatsappMessage
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-[#DFBA73] via-[#D4AF37] to-[#C5A059] text-black font-body font-bold text-sm sm:text-[15px] tracking-wide shadow-[0_6px_25px_rgba(212,175,55,0.35)] hover:shadow-[0_10px_35px_rgba(212,175,55,0.5)] hover:scale-105 transition-all w-full sm:w-auto group"
              >
                <svg className="w-5 h-5 flex-shrink-0 text-black group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                </svg>
                Shop on WhatsApp
              </a>
              <a
                href="/shop"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-[#0A0A0A] bg-[#0A0A0A] text-white font-body font-semibold text-sm sm:text-[15px] tracking-wide hover:bg-white hover:text-[#0A0A0A] hover:border-[#0A0A0A] transition-all hover:scale-105 shadow-md w-full sm:w-auto"
              >
                Shop the Collection
              </a>
            </div>

          </div>

          {/* Right Column: Visual Showcase (Arch + 2x2 Grid + NEW ARRIVAL Badge) - Desktop only */}
          <div className="hidden lg:flex relative items-center justify-end gap-5 xl:gap-6 py-4">
            
            {/* Center-Right Archway Image with Double Gold Frame */}
            <div className="w-[350px] xl:w-[390px] h-[460px] xl:h-[490px] rounded-t-full rounded-b-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.12)] border-[4px] border-[#D4AF37] ring-2 ring-[#D4AF37]/30 relative bg-[#F5F5F0] flex-shrink-0">
              {archImages.map((src, index) => (
                <div
                  key={src + "-arch"}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === activeArchIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                >
                  <Image
                    src={src}
                    alt="Elite Hijab Collection"
                    fill
                    sizes="390px"
                    className="object-cover object-top"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>

            {/* Photo Collage with Floating Circle Badge in Black & Gold */}
            <div className="relative w-[245px] xl:w-[275px] h-[460px] xl:h-[490px] bg-white rounded-3xl p-2.5 border-[3px] border-[#D4AF37]/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex-shrink-0 flex flex-col">
              
              {/* Floating Circle Badge in Black & Gold */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-12 z-30 w-24 h-24 rounded-full bg-[#0A0A0A] border-[3px] border-[#D4AF37] shadow-[0_8px_25px_rgba(212,175,55,0.35)] flex flex-col items-center justify-center text-center p-1">
                <span className="text-[#D4AF37] text-xl leading-none mb-1.5 animate-pulse">✦</span>
                <span className="font-display font-bold text-[11px] tracking-wider text-white uppercase leading-tight">
                  NEW <br /> ARRIVAL
                </span>
              </div>

              {/* Single Image Showcase */}
              <div className="relative w-full flex-1 min-h-0 rounded-2xl overflow-hidden bg-[#F5F5F0]">
                {gridImages.map((src, idx) => (
                  <div
                    key={src + "-grid-single-" + idx}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                      idx === activeGridIndex ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-105"
                    }`}
                  >
                    <Image
                      src={src}
                      alt={`New Arrival Look ${idx + 1}`}
                      fill
                      sizes="280px"
                      className="object-cover object-top"
                      priority={idx === 0}
                    />
                  </div>
                ))}
              </div>

            </div>

          </div>

        </div>

        {/* Bottom Feature Bar (Clean White Card with Gold Icons & Bold Black Titles) */}
        <div className="mt-6 sm:mt-8 lg:mt-10 w-full bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-[#EAEAEA] p-4 sm:p-5 lg:p-6 z-10 relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            
            {/* Item 1 */}
            <div className="flex items-center gap-2.5 sm:gap-4">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-[#FAF6EC] border border-[#D4AF37]/50 flex items-center justify-center text-[#AA8034] flex-shrink-0 shadow-sm">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h4 className="font-body font-bold text-[13px] sm:text-[15px] text-[#0A0A0A] leading-snug">Premium</h4>
                <p className="font-body text-[11px] sm:text-[13px] text-[#666666] mt-0.5">Quality Fabric</p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-2.5 sm:gap-4 sm:border-l sm:border-[#EAEAEA] sm:pl-4 lg:pl-6">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-[#FAF6EC] border border-[#D4AF37]/50 flex items-center justify-center text-[#AA8034] flex-shrink-0 shadow-sm">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h4 className="font-body font-bold text-[13px] sm:text-[15px] text-[#0A0A0A] leading-snug">Elegant</h4>
                <p className="font-body text-[11px] sm:text-[13px] text-[#666666] mt-0.5">Designs</p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-2.5 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#EAEAEA] lg:border-l lg:pl-6">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-[#FAF6EC] border border-[#D4AF37]/50 flex items-center justify-center text-[#AA8034] flex-shrink-0 shadow-sm">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="font-body font-bold text-[13px] sm:text-[15px] text-[#0A0A0A] leading-snug">Comfortable</h4>
                <p className="font-body text-[11px] sm:text-[13px] text-[#666666] mt-0.5">All Day Wear</p>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex items-center gap-2.5 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#EAEAEA] sm:border-l sm:pl-4 lg:pl-6">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-[#FAF6EC] border border-[#D4AF37]/50 flex items-center justify-center text-[#AA8034] flex-shrink-0 shadow-sm">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h4 className="font-body font-bold text-[13px] sm:text-[15px] text-[#0A0A0A] leading-snug">Affordable</h4>
                <p className="font-body text-[11px] sm:text-[13px] text-[#666666] mt-0.5">Luxury</p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Hero Line Art Animation */}
      <HeroLineArt className="hidden lg:block absolute bottom-4 right-4 w-[110px] h-[110px] opacity-25 z-0 pointer-events-none" />
    </section>
  );
}

