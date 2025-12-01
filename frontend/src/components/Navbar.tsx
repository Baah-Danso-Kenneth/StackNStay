import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Wallet, Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserMenu } from "./UserMenu";

const Navbar = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { theme, setTheme } = useTheme();
  const { userData, connectWallet, disconnectWallet } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary to-primary-glow rounded-xl rotate-3 group-hover:rotate-6 transition-transform duration-300 opacity-20"></div>
              <div className="absolute inset-0 bg-gradient-to-bl from-primary to-primary-glow rounded-xl -rotate-3 group-hover:-rotate-6 transition-transform duration-300 opacity-20"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white">
                  <path d="M3 9.5L12 4L21 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 13V19.4C19 19.7314 18.7314 20 18.4 20H5.6C5.26863 20 5 19.7314 5 19.4V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 20V14H15V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="font-heading text-2xl font-bold tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                StackNstay
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                Decentralized Living
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-smooth"
            >
              Home
            </Link>
            <Link
              to="/properties"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-smooth"
            >
              Properties
            </Link>
            
            {/* Authenticated-only nav items */}
            {userData && (
              <>
                <Link
                  to="/my-bookings"
                  className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-smooth"
                >
                  My Bookings
                </Link>
                <Link
                  to="/history"
                  className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-smooth"
                >
                  History
                </Link>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full transition-smooth hover:bg-muted"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Wallet Connect / User Menu */}
            {userData ? (
              <UserMenu
                address={userData.profile.stxAddress.mainnet}
                onDisconnect={disconnectWallet}
              />
            ) : (
              <Button
                onClick={connectWallet}
                className="gradient-hero text-primary-foreground shadow-elegant hover:shadow-glow transition-smooth font-semibold"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
