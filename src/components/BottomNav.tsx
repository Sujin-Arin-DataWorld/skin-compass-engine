import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Heart, Sparkles, User, ShoppingBag } from "lucide-react";

export function BottomNav() {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Hide if scrolling down, show if scrolling up or at the very top
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

    // Define nav items
    const navItems = [
        { id: "home", icon: Home, path: "/", label: "Home" },
        { id: "wishlist", icon: Heart, path: "/wishlist", label: "Wishlist" },
        { id: "ai", icon: Sparkles, path: "/diagnosis", label: "AI Scan", isCenter: true },
        { id: "profile", icon: User, path: "/profile", label: "Profile" },
        { id: "bag", icon: ShoppingBag, path: "/cart", label: "Bag" },
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
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] pointer-events-none" />

                    <div className="relative flex items-center justify-around px-2 h-16">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.id === "profile" && (location.pathname === "/login" || location.pathname === "/signup"));

                            if (item.isCenter) {
                                return (
                                    <Link
                                        key={item.id}
                                        to={item.path}
                                        className="relative -top-5 flex flex-col items-center justify-center pointer-events-auto"
                                        aria-label={item.label}
                                    >
                                        <motion.div
                                            className="w-16 h-16 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.15)] overflow-hidden"
                                            whileTap={{ scale: 0.9 }}
                                            animate={{
                                                boxShadow: isActive ?
                                                    ['0 4px 20px rgba(0, 255, 255, 0.4)', '0 4px 25px rgba(0, 255, 255, 0.6)', '0 4px 20px rgba(0, 255, 255, 0.4)'] :
                                                    '0 4px 20px rgba(0,0,0,0.15)'
                                            }}
                                            transition={{ duration: 2, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}
                                        >
                                            {/* Premium Cyan/Lime Gradient */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-[#00FFFF] to-[#39FF14] dark:from-[#00E5FF] dark:to-[#32CD32] opacity-90" />

                                            {/* Deep Charcoal inner for Dark mode, White inner for Light mode */}
                                            <div className="absolute inset-[2px] rounded-full bg-white dark:bg-[#1A1A1A] flex items-center justify-center">
                                                <item.icon className="w-7 h-7 text-[#00E5FF] dark:text-[#39FF14]" strokeWidth={isActive ? 2.5 : 2} />
                                            </div>
                                        </motion.div>
                                        <span className="text-[9px] font-medium tracking-wide !text-[#00E5FF] dark:!text-[#39FF14] mt-1 drop-shadow-sm uppercase font-['DM_Sans',_'Space_Grotesk',_system-ui,_sans-serif]">
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            }

                            return (
                                <Link
                                    key={item.id}
                                    to={item.path}
                                    className={`flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors pointer-events-auto ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    aria-label={item.label}
                                >
                                    <motion.div whileTap={{ scale: 0.85 }}>
                                        <item.icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                </motion.nav>
            )}
        </AnimatePresence>
    );
}
