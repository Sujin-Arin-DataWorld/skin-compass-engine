import { useState, useEffect } from "react"; 
import { Link, useLocation } from "react-router-dom"; 
import { motion, AnimatePresence } from "framer-motion"; 
// 1. Sparkles 대신 ClipboardCheck 적용
import { Home, Heart, ClipboardCheck, User, ShoppingBag } from "lucide-react"; 

export function BottomNav() { 
    const [isVisible, setIsVisible] = useState(true); 
    const [lastScrollY, setLastScrollY] = useState(0); 
    const location = useLocation(); 

    // 사용자님의 원본 스크롤 로직 100% 유지
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

    // 2. 튀어나오는 isCenter 속성을 지우고 모두 똑같은 조건으로 맞춤
    const navItems = [ 
        { id: "home", icon: Home, path: "/", label: "Home" }, 
        { id: "wishlist", icon: Heart, path: "/wishlist", label: "Wishlist" }, 
        { id: "ai", icon: ClipboardCheck, path: "/diagnosis", label: "AI Scan" }, 
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
                    {/* 사용자님의 원본 Glassmorphism (다크모드 그림자 포함) 100% 유지 */} 
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] pointer-events-none" /> 

                    {/* 3. 일렬 정렬을 위해 flex 대신 grid-cols-5 적용 */}
                    <div className="relative grid grid-cols-5 items-center justify-items-center h-16 w-full"> 
                        {navItems.map((item) => { 
                            const isActive = location.pathname === item.path || 
                                (item.id === "profile" && (location.pathname === "/login" || location.pathname === "/signup")); 

                            // 복잡했던 if (item.isCenter) 블록을 완전히 삭제하고, 모든 아이콘에 사용자님의 원본 '일반 아이콘' 렌더링 로직을 적용
                            return ( 
                                <Link 
                                    key={item.id} 
                                    to={item.path} 
                                    className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors pointer-events-auto ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} 
                                    aria-label={item.label} 
                                > 
                                    {/* 사용자님의 원본 클릭 애니메이션과 isActive 시 선 굵기(2.5) 변화 로직 100% 유지 */}
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