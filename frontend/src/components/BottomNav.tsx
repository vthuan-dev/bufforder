import { Home, FileText, ShoppingBag, HelpCircle, User } from "lucide-react";
import { motion } from "motion/react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'record', label: 'Record', icon: FileText },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'help', label: 'Help', icon: HelpCircle },
    { id: 'my', label: 'My', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-50">
      {/* Shadow overlay for depth */}
      <div className="absolute inset-x-0 -top-2 h-2 bg-gradient-to-b from-transparent to-black/5 pointer-events-none" />
      
      <div className="relative">
        <div className="flex items-center justify-around px-4 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                whileTap={{ scale: 0.92 }}
                className="flex flex-col items-center justify-center flex-1 py-1.5 relative"
              >
                {/* Active indicator - top bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    transition={{ 
                      type: "spring", 
                      stiffness: 380, 
                      damping: 30 
                    }}
                  />
                )}
                
                {/* Icon container with animated background */}
                <motion.div
                  animate={isActive ? { 
                    scale: 1.05,
                  } : { 
                    scale: 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative flex flex-col items-center gap-0.5"
                >
                  {/* Glowing background for active icon */}
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl blur-xl -z-10"
                    />
                  )}
                  
                  {/* Icon with gradient on active */}
                  <div className="relative">
                    <Icon 
                      className={`w-5 h-5 transition-all duration-200 ${
                        isActive 
                          ? 'text-blue-600' 
                          : 'text-gray-400'
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>
                  
                  {/* Label */}
                  <motion.span 
                    className={`text-[9px] transition-all duration-200 ${
                      isActive 
                        ? 'text-blue-600' 
                        : 'text-gray-500'
                    }`}
                    animate={isActive ? { 
                      opacity: 1,
                      y: 0
                    } : { 
                      opacity: 0.8,
                      y: 0
                    }}
                  >
                    {tab.label}
                  </motion.span>
                </motion.div>

                {/* Ripple effect on tap */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0.5 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0 bg-blue-500/20 rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Safe area for notch phones */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </div>
  );
}
