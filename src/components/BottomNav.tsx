import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Heart, LayoutGrid, User, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useNavStore } from "@/store/navStore";
import { useI18nStore } from "@/store/i18nStore";

export function BottomNav() {
  const [isVisible, setIsVisible] = useState(true);
  // [PWA-FIX] useRef instead of useState — ref updates never trigger re-renders
  const lastScrollYRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const location = useLocation();
  const cartCount = useCartStore((s) => s.totalItems());
  const { openMobileMenu } = useNavStore();
  const { language } = useI18nStore();
  const navFont = { fontFamily: "var(--font-sans)" };

  useEffect(() => {
    const handleScroll = () => {
      // [PWA-FIX] Debounce via rAF — fires at most once per frame, not every pixel
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        // [PWA-FIX] iOS rubber-band guard: overscroll produces negative scrollY → always show nav
        if (currentScrollY <= 0) {
          setIsVisible(true);
          lastScrollYRef.current = 0;
          return;
        }
        const shouldShow = !(currentScrollY > lastScrollYRef.current && currentScrollY > 50);
        // [PWA-FIX] Only call setState when the boolean actually changes → no spurious re-renders
        setIsVisible((prev) => (prev === shouldShow ? prev : shouldShow));
        lastScrollYRef.current = currentScrollY;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      // [PWA-FIX] Clean up any pending animation frame on unmount
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, []); // [PWA-FIX] Empty deps — refs never need to be listed as dependencies

  const labels: Record<string, Record<string, string>> = {
    home: { en: "Home", de: "Start", ko: "홈" },
    categories: { en: "Categories", de: "Kategorien", ko: "카테고리" },
    cart: { en: "Cart", de: "Warenkorb", ko: "장바구니" },
    wishlist: { en: "Wishlist", de: "Wunschliste", ko: "위시리스트" },
    profile: { en: "Profile", de: "Profil", ko: "프로필" },
  };

  const navItems = [
    { id: "home", icon: Home, path: "/", label: labels.home[language] ?? labels.home.en },
    { id: "categories", icon: LayoutGrid, path: null, label: labels.categories[language] ?? labels.categories.en },
    { id: "cart", icon: ShoppingBag, path: "/cart", label: labels.cart[language] ?? labels.cart.en },
    { id: "wishlist", icon: Heart, path: "/wishlist", label: labels.wishlist[language] ?? labels.wishlist.en },
    { id: "profile", icon: User, path: "/profile", label: labels.profile[language] ?? labels.profile.en },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-0 w-full z-50 md:hidden pb-[env(safe-area-inset-bottom)]"
        >
          {/* Glassmorphism background */}
          <div className="absolute inset-0 bg-white/60 dark:bg-[#F5F5F7]/70 backdrop-blur-2xl border-t border-white/40 dark:border-white/[0.08] shadow-[0_-1px_0_0_rgba(0,0,0,0.04),0_-20px_60px_-10px_rgba(0,0,0,0.08)] dark:shadow-[0_-1px_0_0_rgba(255,255,255,0.04),0_-20px_60px_-10px_rgba(0,0,0,0.6)] pointer-events-none" />

          <div className="relative grid grid-cols-5 items-center justify-items-center h-16 w-full" style={navFont}>
            {navItems.map((item) => {
              const isActive =
                item.path !== null &&
                (location.pathname === item.path ||
                  (item.id === "profile" &&
                    (location.pathname === "/login" || location.pathname === "/signup")));

              const content = (
                <div className="relative">
                  <motion.div whileTap={{ scale: 0.82 }}>
                    <item.icon
                      className="w-[23px] h-[23px]"
                      strokeWidth={isActive ? 2.5 : 1.7}
                    />
                  </motion.div>
                  {/* Cart badge */}
                  {item.id === "cart" && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--ssl-accent)] text-[0.55rem] font-bold text-[#F5F5F7] leading-none">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </div>
              );

              const baseClass = `flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors pointer-events-auto ${isActive
                ? ""
                : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`;
              const activeStyle = isActive ? { color: 'var(--ssl-accent)' } as React.CSSProperties : undefined;

              if (item.id === "categories") {
                return (
                  <button
                    key={item.id}
                    onClick={openMobileMenu}
                    className={baseClass}
                    style={activeStyle}
                    aria-label={item.label}
                  >
                    {content}
                    <span className="text-[0.6rem] mt-0.5 leading-none">{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.path!}
                  className={baseClass}
                  style={activeStyle}
                  aria-label={item.label}
                >
                  {content}
                  <span className="text-[0.6rem] mt-0.5 leading-none">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
