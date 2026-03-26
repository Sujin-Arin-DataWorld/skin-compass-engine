import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Heart, LayoutGrid, User, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useNavStore } from "@/store/navStore";
import { useI18nStore } from "@/store/i18nStore";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function BottomNav() {
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();
  const cartCount = useCartStore((s) => s.totalItems());
  const { openMobileMenu } = useNavStore();
  const { language } = useI18nStore();
  const navFont = { fontFamily: "var(--font-sans)" };

  // Scroll-direction threshold: hide on ↓ (delta > 8px), show on ↑ (delta > 4px)
  // Using a dead-zone prevents micro-jitters from iOS momentum scroll
  const accumulatedRef = useRef(0);

  useScrollAnimation((scrollY, prevScrollY) => {
    // Always show at top of page
    if (scrollY <= 0) {
      setIsVisible(true);
      accumulatedRef.current = 0;
      return;
    }

    const delta = scrollY - prevScrollY;
    accumulatedRef.current += delta;

    // Hide threshold: accumulated ↓ scroll > 12px
    if (accumulatedRef.current > 12) {
      setIsVisible((prev) => (prev ? false : prev));
      accumulatedRef.current = 0;
    }
    // Show threshold: accumulated ↑ scroll > 6px (more responsive on re-show)
    else if (accumulatedRef.current < -6) {
      setIsVisible((prev) => (prev ? prev : true));
      accumulatedRef.current = 0;
    }
  });

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
    <nav
      className="fixed bottom-0 w-full z-50 md:hidden"
      style={{
        // GPU-composited slide: never leaves GPU layer, no layout thrashing
        transform: isVisible ? 'translate3d(0,0,0)' : 'translate3d(0,100%,0)',
        transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform',
        // Safe area inset for iPhone home indicator / notch
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Glassmorphism background — pointer-events-none so taps pass through to buttons */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'var(--ssl-bg, #fff)',
          opacity: 0.82,
          backdropFilter: 'blur(24px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 -1px 0 0 rgba(0,0,0,0.04), 0 -20px 60px -10px rgba(0,0,0,0.08)',
        }}
      />

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
    </nav>
  );
}
