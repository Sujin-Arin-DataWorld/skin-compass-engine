import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Heart, ClipboardCheck, User, ShoppingBag } from "lucide-react";

export function BottomNav() {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const location = useLocation();

    // 🌟 사용자님의 기존 스크롤 숨김 애니메이션 로직 완벽 보존!
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
        { id: "home", icon: Home, path: "/", label: "Home" },
        { id: "wishlist", icon: Heart, path: "/wishlist", label: "Wishlist" },
        { id: "ai", icon: ClipboardCheck, path: "/diagnosis", label: "AI Scan", isCenter: true },
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
                    {/* Glassmorphism background 보존 */}
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] pointer-events-none" />

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
                                            // 🌟 이중 테두리 플로팅 스타일 보존 (다크/라이트 모드 UI 최적화 적용됨)
                                            className="w-16 h-16 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-[4px] border-background overflow-hidden"
                                            whileTap={{ scale: 0.9 }}
                                            animate={{
                                                boxShadow: isActive ?
                                                    ['0 4px 15px rgba(138, 154, 91, 0.4)', '0 4px 25px rgba(138, 154, 91, 0.6)', '0 4px 15px rgba(138, 154, 91, 0.4)'] :
                                                    '0 4px 15px rgba(0,0,0,0.1)'
                                            }}
                                            transition={{ duration: 2, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}
                                        >
                                            {/* 선 굵기 1.5로 통일 */}
                                            <item.icon className="w-8 h-8" strokeWidth={1.5} />
                                        </motion.div>
                                        {/* ✂️ 여기에 있던 <span> 태그(글자)만 깔끔하게 삭제했습니다! */}
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
                                        <item.icon className="w-[22px] h-[22px]" strokeWidth={1.5} />
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