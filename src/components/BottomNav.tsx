import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Heart, LayoutGrid, User, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useNavStore } from "@/store/navStore";
import { useI18nStore } from "@/store/i18nStore";

export function BottomNav() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();
  const cartCount = useCartStore((s) => s.totalItems());
  const { openMobileMenu } = useNavStore();
  const { language } = useI18nStore();
  const navFont = { fontFamily: language === 'ko' ? "'Pretendard', sans-serif" : "'DM Sans', system-ui, sans-serif" };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { id: "home",       icon: Home,        path: "/",         label: "Home" },
    { id: "categories", icon: LayoutGrid,  path: null,        label: "Categories" },
    { id: "cart",       icon: ShoppingBag, path: "/cart",     label: "Cart" },
    { id: "wishlist",   icon: Heart,       path: "/wishlist", label: "Wishlist" },
    { id: "profile",    icon: User,        path: "/profile",  label: "Profile" },
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
          <div className="absolute inset-0 bg-white/60 dark:bg-[#0a0a0a]/70 backdrop-blur-2xl border-t border-white/40 dark:border-white/[0.08] shadow-[0_-1px_0_0_rgba(0,0,0,0.04),0_-20px_60px_-10px_rgba(0,0,0,0.08)] dark:shadow-[0_-1px_0_0_rgba(255,255,255,0.04),0_-20px_60px_-10px_rgba(0,0,0,0.6)] pointer-events-none" />

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
                    <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[0.55rem] font-bold text-[#0a0a0a] leading-none">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </div>
              );

              const baseClass = `flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors pointer-events-auto ${
                isActive
                  ? "text-[#947E5C] dark:text-[#D4AF37]"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`;

              if (item.id === "categories") {
                return (
                  <button
                    key={item.id}
                    onClick={openMobileMenu}
                    className={baseClass}
                    aria-label={item.label}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.path!}
                  className={baseClass}
                  aria-label={item.label}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
