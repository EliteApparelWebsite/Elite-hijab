"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { navLinks, SITE } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import CartDrawer from "./CartDrawer";
import { DesktopMegaMenu, MobileMegaMenu } from "./MegaMenu";
import AnnouncementBanner from "./AnnouncementBanner";
import dbData from "@/lib/db.json";
import { Search, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { getShippingSettings } from "@/actions/admin/shipping";
import { getMegaMenuDiscoverItems } from "@/actions/admin/megaMenuDiscover";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileCollectionOpen, setMobileCollectionOpen] = useState(false);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState<string | null>(null);
  const [desktopCategoryOpen, setDesktopCategoryOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [user, setUser] = useState<any>(null);
  const isAdmin = user && (user.email === 'husnezaman@gmail.com' || user.user_metadata?.role === 'admin');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const [shipping, setShipping] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [discoverItems, setDiscoverItems] = useState<any[]>([]);

  useEffect(() => {
    getShippingSettings()
      .then((data) => setShipping(data))
      .catch((err) => console.error("Error loading header shipping settings:", err));

    getMegaMenuDiscoverItems()
      .then((items) => {
        if (items && items.length > 0) {
          const activeItems = items.filter((item) => item.is_active !== false);
          if (activeItems.length > 0) {
            setDiscoverItems(
              activeItems.map((item) => ({
                id: item.id,
                title: item.title,
                badge: item.badge || "",
                badgeColor: item.badge_color || "bg-[#C84B31] text-white",
                href: item.href,
                image: item.image_url || "/hijab-medina.jpg",
              }))
            );
          }
        }
      })
      .catch((err) => console.error("Error loading discover items:", err));

    const loadCategories = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('categories').select('*').eq('is_active', true);
      if (data && data.length > 0) {
        setCategories(data.map(cat => ({
          id: cat.id,
          title: cat.name,
          description: cat.description || "",
          href: `/shop?category=${cat.id}`,
          image: cat.image_url || "/hijab-medina.jpg",
          parent_id: cat.parent_id || null
        })));
      }
    };
    loadCategories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() || searchCategory) {
      setIsSearching(true);
      let url = '/shop?';
      if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery.trim())}&`;
      if (searchCategory) url += `category=${encodeURIComponent(searchCategory)}`;
      // Clean trailing & if present
      if (url.endsWith('&')) url = url.slice(0, -1);
      if (url.endsWith('?')) url = '/shop'; // Edge case
      router.push(url);

      // Delay closing to show loader
      setTimeout(() => {
        setIsSearching(false);
        setSearchOpen(false);
        setOpen(false);
      }, 1000);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const checkUserSession = () => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; hijabistaa-user-session=`)
      if (parts.length === 2) {
        const val = parts.pop()?.split(';').shift()
        if (val) {
          try {
            const session = JSON.parse(decodeURIComponent(val))
            setUser({ id: session.id, email: session.email, user_metadata: { role: session.role, full_name: session.full_name } })
            return
          } catch (e) { }
        }
      }

      const mockAdmin = document.cookie.includes('mock-admin-logged-in=true')
      if (mockAdmin) {
        setUser({ id: 'mock-admin-id', email: 'husnezaman@gmail.com', user_metadata: { role: 'admin' } })
        return
      }

      setUser(null)
    }

    const supabase = createClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setUser(data.user);
        }
      }).catch(() => { });
    }

    window.addEventListener('hijabistaa-login-status-change', checkUserSession)
    return () => {
      window.removeEventListener('hijabistaa-login-status-change', checkUserSession)
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <div className={`fixed top-0 inset-x-0 z-[99999] flex flex-col pointer-events-none ${open ? "bottom-0 h-[100dvh]" : ""}`}>
        <div className="pointer-events-auto">
          <AnnouncementBanner />
        </div>
        <header
          className={`w-full transition-all duration-300 pointer-events-auto ${open
            ? "bg-white text-black"
            : scrolled
              ? "bg-white/95 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.06)] border-b border-[#D4AF37]/35"
              : "bg-white/90 backdrop-blur-md border-b border-[#EAEAEA] shadow-[0_2px_15px_rgba(0,0,0,0.03)]"
            }`}
        >
          <div className="max-w-wrap mx-auto px-5 md:px-8 flex items-center justify-between h-[72px] md:h-[84px] relative">
            {/* Mobile hamburger — left side on mobile only */}
            <button
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden relative h-10 w-10 flex items-center justify-center text-[#0A0A0A] bg-[#F7F7F7] border border-[#E5E5E5] rounded-full shadow-sm hover:bg-[#0A0A0A] hover:text-white transition-all shrink-0 cursor-pointer"
            >
              <span className="sr-only">Menu</span>
              {open ? (
                <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            <a href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="relative h-11 w-11 md:h-13 md:w-13 rounded-xl overflow-hidden shadow-sm border-2 border-[#D4AF37]/60 shrink-0 group-hover:border-[#D4AF37] transition-all">
                <Image
                  src="/Elitehijab-logo.jpeg"
                  alt="Elite Hijab logo"
                  fill
                  sizes="(max-width: 768px) 44px, 52px"
                  className="object-cover"
                  priority
                />
              </div>
              <span className="font-display font-bold text-xl md:text-2xl lg:text-[25px] tracking-wider bg-gradient-to-r from-[#996515] via-[#D4AF37] to-[#8C6219] bg-clip-text text-transparent uppercase group-hover:brightness-110 transition-all drop-shadow-[0_1px_1px_rgba(212,175,55,0.15)]">
                Elite Hijab
              </span>
            </a>

            <nav className="hidden lg:flex items-center gap-8 h-full">
              {navLinks.map((link) => {
                if (link.label === "Category" || link.label === "Categories") {
                  return (
                    <div
                      key={link.label}
                      className="static group flex items-center h-full"
                      onMouseEnter={() => setDesktopCategoryOpen(true)}
                      onMouseLeave={() => setDesktopCategoryOpen(false)}
                    >
                      <button
                        type="button"
                        onClick={() => setDesktopCategoryOpen(!desktopCategoryOpen)}
                        className="font-body text-[15px] font-medium text-[#111111] hover:text-[#AA8034] transition-colors flex items-center gap-1.5 cursor-pointer py-2 tracking-wide"
                      >
                        {link.label}
                        <svg
                          className={`w-4 h-4 text-[#666666] group-hover:text-[#AA8034] transition-transform duration-200 ${desktopCategoryOpen ? "rotate-180 text-[#AA8034]" : "group-hover:rotate-180"
                            }`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <DesktopMegaMenu
                        isOpen={desktopCategoryOpen}
                        onClose={() => setDesktopCategoryOpen(false)}
                        categories={categories}
                        discoverItems={discoverItems}
                      />
                    </div>
                  );
                }
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    className="font-body text-[15px] font-medium text-[#111111] hover:text-[#AA8034] transition-colors relative group tracking-wide"
                  >
                    {link.label}
                    <span className="absolute left-0 -bottom-1.5 h-[1.5px] w-0 bg-[#D4AF37] group-hover:w-full transition-all duration-300 shadow-[0_0_6px_#D4AF37]" />
                  </a>
                )
              })}
            </nav>

            <div className="hidden lg:flex items-center gap-3.5">
              <button
                onClick={() => setSearchOpen(true)}
                className="relative flex items-center justify-center h-10 w-10 rounded-full bg-[#F7F7F7] text-[#0A0A0A] border border-[#E5E5E5] shadow-sm hover:bg-white hover:border-[#D4AF37] hover:text-[#AA8034] hover:scale-105 transition-all shrink-0 cursor-pointer"
                title="Search"
              >
                <Search className="w-[17px] h-[17px]" strokeWidth={2.2} />
              </button>

              <button
                onClick={() => router.push('/wishlist')}
                className="relative flex items-center justify-center h-10 w-10 rounded-full bg-[#F7F7F7] text-[#0A0A0A] border border-[#E5E5E5] shadow-sm hover:bg-white hover:border-[#D4AF37] hover:text-[#AA8034] hover:scale-105 transition-all shrink-0 cursor-pointer"
                title="Wishlist"
              >
                <Heart className="w-[17px] h-[17px]" strokeWidth={2.2} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0A0A0A] text-[#DFBA73] text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm animate-scale-up border border-[#D4AF37]">
                    {wishlistCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center justify-center h-10 w-10 rounded-full bg-[#0A0A0A] text-white border border-[#0A0A0A] shadow-md hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] hover:scale-105 transition-all shrink-0 cursor-pointer"
                title="Shopping Cart"
              >
                <svg className="w-[19px] h-[19px]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4AF37] text-black border border-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm animate-scale-up">
                    {cartCount}
                  </span>
                )}
              </button>

              {user && (
                <div className="flex items-center gap-3 shrink-0">
                  {isAdmin && (
                    <a
                      href="/admin"
                      title="Admin Dashboard"
                      className="text-[#0A0A0A] hover:text-[#AA8034] transition-colors p-1 shrink-0"
                    >
                      <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="7" height="9" rx="1" />
                        <rect x="14" y="3" width="7" height="5" rx="1" />
                        <rect x="14" y="12" width="7" height="9" rx="1" />
                        <rect x="3" y="16" width="7" height="5" rx="1" />
                      </svg>
                    </a>
                  )}
                  <a
                    href="/profile"
                    title="Manage Profile"
                    className="text-[#0A0A0A] hover:text-[#AA8034] transition-colors p-1 shrink-0"
                  >
                    <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </a>
                </div>
              )}
              {user ? (
                <button
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    localStorage.removeItem('hijabistaa-customer-profile');
                    setUser(null);
                    window.location.reload();
                  }}
                  className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-[#0A0A0A] text-white font-body font-bold text-xs uppercase tracking-wider hover:bg-[#D4AF37] hover:text-black transition-all shadow-sm cursor-pointer"
                >
                  Logout
                </button>
              ) : (
                <a
                  href="/login"
                  className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-[#0A0A0A] text-white font-body font-bold text-xs uppercase tracking-wider hover:bg-[#D4AF37] hover:text-black transition-all shadow-sm"
                >
                  Login/Register
                </a>
              )}
            </div>

            {/* Mobile cart & wishlist & search — right side on mobile only */}
            <div className="lg:hidden flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="relative h-9 w-9 flex items-center justify-center rounded-full bg-[#F7F7F7] border border-[#E5E5E5] text-[#0A0A0A] shadow-sm hover:border-[#D4AF37] transition-all shrink-0 cursor-pointer"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push('/wishlist')}
                className="relative h-9 w-9 flex items-center justify-center rounded-full bg-[#F7F7F7] border border-[#E5E5E5] text-[#0A0A0A] shadow-sm hover:border-[#D4AF37] transition-all shrink-0 cursor-pointer"
                title="Wishlist"
              >
                <Heart className="w-4 h-4" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0A0A0A] text-[#DFBA73] text-[8px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {wishlistCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCartOpen(true)}
                className="relative h-9 w-9 flex items-center justify-center rounded-full bg-[#0A0A0A] text-white shadow-sm shrink-0 cursor-pointer hover:bg-[#D4AF37] hover:text-black"
                title="Shopping Cart"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D4AF37] text-black border border-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>        {/* Mobile menu panel */}
        {/* Mobile menu panel */}
        <div
          className={`lg:hidden flex-1 w-full bg-white border-b border-[#EAEAEA] z-[9999] overflow-y-auto overscroll-contain transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${open ? "block opacity-100 pointer-events-auto" : "hidden opacity-0 pointer-events-none"
            }`}
        >
          <nav className="flex flex-col px-6 pt-6 pb-32 gap-1">
            <form onSubmit={handleSearch} className="mb-5 relative">
              <div className="flex bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl overflow-hidden focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/20 transition-all shadow-sm h-[48px]">
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="bg-[#EFEFEF] text-[#0A0A0A] text-[13px] pl-4 pr-7 border-r border-[#E0E0E0] focus:outline-none cursor-pointer appearance-none font-medium max-w-[115px] truncate"
                  style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="none" stroke="%23AA8034" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '12px' }}
                >
                  <option value="" className="bg-white text-black">All</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-white text-black">{cat.title}</option>
                  ))}
                </select>
                <div className="relative flex-1 flex">
                  <input
                    type="text"
                    placeholder="Search collection..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent py-3 pl-3 pr-11 text-sm focus:outline-none text-[#0A0A0A] placeholder:text-[#888888] w-full"
                  />
                  <button type="submit" disabled={isSearching} className="absolute right-0 top-0 h-full px-3.5 flex items-center justify-center text-[#AA8034] hover:text-black transition-colors disabled:opacity-50 cursor-pointer">
                    {isSearching ? (
                      <svg className="animate-spin w-5 h-5 text-[#AA8034]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </form>
            {navLinks.map((link, i) => {
              if (link.label === "Category" || link.label === "Categories") {
                const isOpen = activeMobileDropdown === link.label || (activeMobileDropdown === null && mobileCollectionOpen);
                return (
                  <div key={link.label} className="border-b border-[#F0F0F0] py-3.5">
                    <button
                      onClick={() => {
                        if (isOpen) {
                          setActiveMobileDropdown("");
                          setMobileCollectionOpen(false);
                        } else {
                          setActiveMobileDropdown(link.label);
                          setMobileCollectionOpen(true);
                        }
                      }}
                      className="w-full flex items-center justify-between font-display text-2xl font-semibold text-[#0A0A0A] hover:text-[#AA8034] text-left transition-colors cursor-pointer"
                    >
                      <span>{link.label}</span>
                      <svg className={`w-6 h-6 text-[#AA8034] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isOpen && (
                      <MobileMegaMenu isOpen={isOpen} onClose={() => setOpen(false)} categories={categories} discoverItems={discoverItems} />
                    )}
                  </div>
                )
              }
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-2xl font-semibold text-[#0A0A0A] hover:text-[#AA8034] py-3.5 border-b border-[#F0F0F0] transition-colors"
                  style={{ transitionDelay: `${i * 40}ms` }}
                >
                  {link.label}
                </a>
              )
            })}
            {user && (
              <>
                {isAdmin && (
                  <a
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="font-display text-2xl font-semibold text-[#0A0A0A] hover:text-[#AA8034] py-3.5 border-b border-[#F0F0F0] flex items-center justify-between"
                  >
                    <span>Admin Dashboard</span>
                    <svg className="w-6 h-6 text-[#AA8034]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="7" height="9" rx="1" />
                      <rect x="14" y="3" width="7" height="5" rx="1" />
                      <rect x="14" y="12" width="7" height="9" rx="1" />
                      <rect x="3" y="16" width="7" height="5" rx="1" />
                    </svg>
                  </a>
                )}
                <a
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="font-display text-2xl font-semibold text-[#0A0A0A] hover:text-[#AA8034] py-3.5 border-b border-[#F0F0F0] flex items-center justify-between"
                >
                  <span>Manage Profile</span>
                  <svg className="w-6 h-6 text-[#AA8034]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </a>
              </>
            )}
            {user ? (
              <button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  localStorage.removeItem('hijabistaa-customer-profile');
                  setUser(null);
                  setOpen(false);
                  window.location.reload();
                }}
                className="mt-7 inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-[#0A0A0A] text-white hover:bg-[#D4AF37] hover:text-black font-bold font-body text-base shadow-md transition-all cursor-pointer"
              >
                Logout
              </button>
            ) : (
              <a
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-7 inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-[#0A0A0A] text-white hover:bg-[#D4AF37] hover:text-black font-bold font-body text-base shadow-md transition-all text-center"
              >
                Login/Register
              </a>
            )}
            <div className="mt-8 text-sm text-[#777777] font-body">
              <p>{SITE.phone}</p>
              <p className="mt-1">{SITE.email}</p>
            </div>
          </nav>
        </div>
      </div>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} shipping={shipping} />

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100000] flex items-start justify-center pt-[15vh]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-2xl mx-4 bg-white border-2 border-[#D4AF37]/50 rounded-3xl p-6 md:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.18)] animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-2xl text-[#0A0A0A] flex items-center gap-2">
                <Search className="w-5 h-5 text-[#AA8034]" />
                Search <span className="bg-gradient-to-r from-[#B38728] via-[#D4AF37] to-[#AA771C] bg-clip-text text-transparent">Collection</span>
              </h2>
              <button onClick={() => setSearchOpen(false)} className="p-2 bg-[#F5F5F5] border border-[#E5E5E5] rounded-full text-[#333333] hover:text-black hover:border-[#D4AF37] transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-3">
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl px-4 py-3.5 text-[15px] font-medium text-[#0A0A0A] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
                >
                  <option value="" className="bg-white text-black">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-white text-black">{cat.title}</option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search premium hijabs, abayas, suits..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full h-full bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl py-3.5 pl-4 pr-12 text-[15px] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-[#0A0A0A] placeholder:text-[#888888]"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#AA8034]" />
                </div>
              </div>
              <button type="submit" disabled={isSearching} className="w-full mt-2 py-3.5 bg-[#0A0A0A] hover:bg-[#D4AF37] text-white hover:text-black font-body font-bold text-base uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer">
                {isSearching ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </>
                ) : (
                  "Search Products"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
