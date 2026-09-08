"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Copy, Check, ShoppingBag, Award, Sparkles, Truck } from "lucide-react";
import { PromoPopupConfig, DEFAULT_PROMO_POPUP } from "@/lib/promo";

interface PromoPopupProps {
  settings?: PromoPopupConfig;
  isPreview?: boolean;
  isOpenOverride?: boolean;
  onCloseOverride?: () => void;
}

export default function PromoPopup({
  settings = DEFAULT_PROMO_POPUP,
  isPreview = false,
  isOpenOverride,
  onCloseOverride,
}: PromoPopupProps) {
  if (!isPreview) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 38,
    seconds: 45,
  });
  const router = useRouter();

  // Handle frequency and display logic
  useEffect(() => {
    if (isPreview) {
      setIsOpen(Boolean(isOpenOverride));
      return;
    }

    if (!settings.enabled) return;

    const checkShouldShow = () => {
      const { frequency, max_views } = settings;

      if (frequency === "always") {
        // Show on every page load / refresh
        return true;
      }

      if (frequency === "once_session") {
        const shown = sessionStorage.getItem("promo_popup_shown_session");
        if (!shown) {
          sessionStorage.setItem("promo_popup_shown_session", "true");
          return true;
        }
        return false;
      }

      if (frequency === "once_day") {
        const lastShown = localStorage.getItem("promo_popup_shown_day_ts");
        const now = Date.now();
        if (!lastShown || now - Number(lastShown) > 24 * 60 * 60 * 1000) {
          localStorage.setItem("promo_popup_shown_day_ts", String(now));
          return true;
        }
        return false;
      }

      if (frequency === "once_ever") {
        const shown = localStorage.getItem("promo_popup_shown_ever");
        if (!shown) {
          localStorage.setItem("promo_popup_shown_ever", "true");
          return true;
        }
        return false;
      }

      if (frequency === "custom_times") {
        const count = Number(localStorage.getItem("promo_popup_view_count") || "0");
        if (count < (max_views || 3)) {
          localStorage.setItem("promo_popup_view_count", String(count + 1));
          return true;
        }
        return false;
      }

      return false;
    };

    const timer = setTimeout(() => {
      if (checkShouldShow()) {
        setIsOpen(true);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [settings, isPreview, isOpenOverride]);

  // Sync controlled state when previewing
  useEffect(() => {
    if (isPreview && isOpenOverride !== undefined) {
      setIsOpen(isOpenOverride);
    }
  }, [isPreview, isOpenOverride]);

  // Countdown ticking effect
  useEffect(() => {
    if (!isOpen) return;

    // Initialize or load target expiry
    let expiry = localStorage.getItem("promo_popup_expiry_target");
    if (!expiry || Number(expiry) <= Date.now()) {
      const target = Date.now() + (settings.timer_hours || 62) * 3600 * 1000;
      localStorage.setItem("promo_popup_expiry_target", String(target));
      expiry = String(target);
    }

    const interval = setInterval(() => {
      const diff = Number(expiry) - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, settings.timer_hours]);

  const handleClose = () => {
    setIsOpen(false);
    if (onCloseOverride) onCloseOverride();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(settings.code || "WELCOME15");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShopNow = () => {
    handleClose();
    if (!isPreview && settings.button_link) {
      router.push(settings.button_link);
    }
  };

  if (!isOpen) return null;

  // Format numbers with leading zeros
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-md animate-modal-fade-in overflow-y-auto">
      {/* Modal Card */}
      <div
        className="relative w-full max-w-[760px] bg-white rounded-2xl md:rounded-[2rem] shadow-[0_25px_70px_rgba(0,0,0,0.25)] overflow-hidden border-2 border-[#D4AF37] ring-1 ring-[#D4AF37]/30 animate-modal-scale-up flex flex-col md:flex-row my-auto max-h-[88vh] md:max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close popup"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#D4AF37]/60 text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#D4AF37] flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4 sm:w-4 sm:h-4" />
        </button>

        {/* Decorative subtle dots in corners */}
        <div className="absolute top-3.5 left-3.5 grid grid-cols-3 gap-1 opacity-20 pointer-events-none hidden sm:grid">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-[#D4AF37]" />
          ))}
        </div>
        <div className="absolute bottom-3.5 left-3.5 grid grid-cols-3 gap-1 opacity-20 pointer-events-none hidden sm:grid">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-[#D4AF37]" />
          ))}
        </div>

        {/* Left Section: Content & Coupon */}
        <div className="w-full md:w-[52%] p-4 sm:p-6 md:p-7 flex flex-col justify-between relative overflow-y-auto no-scrollbar z-10 bg-white">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mt-0.5 sm:mt-0">
            <div className="flex items-center gap-2 sm:gap-2 mb-1.5 sm:mb-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0A0A0A] border border-[#D4AF37] text-[#D4AF37] flex items-center justify-center font-serif text-xs sm:text-sm font-bold shadow-md">
                E
              </div>
              <div className="text-left">
                <span className="font-serif font-bold tracking-wider text-[11px] sm:text-xs text-[#0A0A0A] block leading-tight">
                  ELITE HIJAB
                </span>
                <span className="font-sans text-[7px] sm:text-[8px] tracking-[0.25em] text-[#AA8034] block uppercase leading-none mt-0.5 font-bold">
                  HIJAB &amp; SCARF
                </span>
              </div>
            </div>

            {/* Subtitle Divider */}
            <div className="flex items-center justify-center gap-2 w-full my-0.5 sm:my-1">
              <div className="h-[1px] w-6 sm:w-10 bg-[#D4AF37]/50" />
              <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.22em] text-[#AA8034] uppercase">
                {settings.subtitle || "BEFORE YOU GO!"}
              </span>
              <div className="h-[1px] w-6 sm:w-10 bg-[#D4AF37]/50" />
            </div>

            {/* Headline */}
            <h2 className="font-serif text-xl sm:text-2xl md:text-[26px] leading-tight text-[#0A0A0A] font-bold my-1 px-1 sm:px-2">
              {settings.headline ? (
                settings.headline.split(/(?=\d+%|\b\d+%\s*Off\b)/i).map((part, index) => {
                  const match = part.match(/^(\d+%(\s*Off)?)(.*)$/i);
                  if (match) {
                    return (
                      <span key={index}>
                        <span className="text-[#AA8034] font-bold">{match[1]}</span>
                        {match[3]}
                      </span>
                    );
                  }
                  return part;
                })
              ) : (
                <>
                  Here&apos;s <span className="text-[#AA8034] font-bold">15% Off</span> Just For You
                </>
              )}
            </h2>

            {/* Decorative Flower/Ornament */}
            <div className="text-[#D4AF37] text-[10px] sm:text-xs my-0.5 select-none tracking-widest">
              ❖ ─ ❖
            </div>

            {/* Description */}
            <p className="text-[11px] sm:text-xs text-[#555555] max-w-[250px] sm:max-w-[280px] mx-auto mt-0.5 sm:mt-1 leading-normal">
              {settings.description || "Use the code below at checkout and get 15% OFF on your first order."}
            </p>
          </div>

          {/* Coupon Code Box */}
          <div className="my-2 sm:my-3 px-1 sm:px-4">
            <div
              onClick={handleCopyCode}
              title="Click to copy coupon code"
              className="group relative bg-[#FAF9F6] border-2 border-dashed border-[#D4AF37] hover:border-[#AA8034] rounded-xl py-2 sm:py-2.5 px-3 text-center cursor-pointer transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(212,175,55,0.2)]"
            >
              {/* Scissors Icon */}
              <div className="absolute -top-2.5 left-4 bg-white px-1 text-[11px] sm:text-xs text-[#AA8034] -rotate-90 select-none group-hover:text-[#0A0A0A] transition-colors font-bold">
                ✂
              </div>

              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-lg sm:text-xl font-bold tracking-[0.15em] text-[#0A0A0A] select-all">
                  {settings.code || "WELCOME15"}
                </span>
                <span className="p-1 rounded-lg bg-[#0A0A0A] text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-all shadow-sm">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400 group-hover:text-black" /> : <Copy className="w-3.5 h-3.5" />}
                </span>
              </div>

              {/* Copied feedback badge */}
              {copied && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#0A0A0A] text-[#D4AF37] border border-[#D4AF37]/50 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-bounce">
                  Copied to clipboard! ✓
                </span>
              )}
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="flex flex-col items-center my-1 sm:my-1.5">
            <span className="text-[10px] sm:text-[11px] text-[#666666] font-medium mb-1 sm:mb-1.5">
              Hurry! Offer expires in
            </span>
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              {[
                { label: "DAYS", val: pad(timeLeft.days) },
                { label: "HRS", val: pad(timeLeft.hours) },
                { label: "MINS", val: pad(timeLeft.minutes) },
                { label: "SECS", val: pad(timeLeft.seconds) },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#FAF9F6] border border-[#D4AF37]/40 rounded-lg py-1 px-1.5 sm:py-1.5 sm:px-2 min-w-[42px] sm:min-w-[48px] text-center shadow-sm"
                >
                  <div className="font-mono text-sm sm:text-base font-bold text-[#0A0A0A] leading-none">
                    {item.val}
                  </div>
                  <div className="text-[7px] sm:text-[8px] font-bold tracking-wider text-[#777777] mt-0.5 uppercase">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button & Link */}
          <div className="mt-2.5 sm:mt-3 px-1 sm:px-2">
            <button
              onClick={handleShopNow}
              className="w-full bg-[#0A0A0A] text-white hover:bg-[#D4AF37] hover:text-[#0A0A0A] active:scale-[0.99] font-bold py-2.5 sm:py-3 px-5 rounded-full shadow-md transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm tracking-wide cursor-pointer group border border-[#0A0A0A]"
            >
              <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>{settings.button_text || "SHOP NOW"}</span>
            </button>

            <button
              onClick={handleClose}
              className="w-full text-center text-[11px] sm:text-xs text-[#777777] hover:text-[#0A0A0A] underline underline-offset-4 mt-1.5 sm:mt-2 py-0.5 cursor-pointer transition-colors"
            >
              No, thanks. I&apos;ll pay full price
            </button>
          </div>
        </div>

        {/* Right Section: Image with Arched Curved Divider & Feature Badges */}
        <div className="w-full md:w-[48%] min-h-[200px] sm:min-h-[240px] md:min-h-full relative overflow-hidden flex flex-col justify-end bg-[#FAF9F6]">
          {/* Arched Curved Mask overlay for desktop */}
          <div className="absolute inset-y-0 -left-5 w-10 bg-white rounded-r-[100%] z-10 hidden md:block pointer-events-none shadow-[inset_-6px_0_12px_rgba(0,0,0,0.08)]" />

          {/* Product / Hijab Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src={(!settings.image_url || settings.image_url.includes('hijab-medina')) ? "/assets/images/img_05.webp" : settings.image_url}
              alt="Elite Hijab Collection Offer"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center transform hover:scale-105 transition-transform duration-1000"
              priority
              unoptimized={true}
              fetchPriority="high"
            />
            {/* Soft gradient overlay at bottom for badge contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Bottom Floating Pill Box with 3 Feature Badges */}
          <div className="relative z-10 m-2.5 sm:m-4 bg-white/95 backdrop-blur-md rounded-xl p-2 sm:p-2.5 shadow-lg border border-[#D4AF37]/40 flex items-center justify-around gap-1 sm:gap-1.5">
            <div className="flex items-center gap-1 sm:gap-1.5 text-center sm:text-left">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0A0A0A] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <div>
                <div className="text-[9px] sm:text-[11px] font-bold text-[#0A0A0A] leading-tight">
                  Premium Quality
                </div>
              </div>
            </div>

            <div className="h-5 sm:h-6 w-[1px] bg-[#D4AF37]/30" />

            <div className="flex items-center gap-1 sm:gap-1.5 text-center sm:text-left">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0A0A0A] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <div>
                <div className="text-[9px] sm:text-[11px] font-bold text-[#0A0A0A] leading-tight">
                  Elegant Designs
                </div>
              </div>
            </div>

            <div className="h-5 sm:h-6 w-[1px] bg-[#D4AF37]/30" />

            <div className="flex items-center gap-1 sm:gap-1.5 text-center sm:text-left">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0A0A0A] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <div>
                <div className="text-[9px] sm:text-[11px] font-bold text-[#0A0A0A] leading-tight">
                  Fast Delivery
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
