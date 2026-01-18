import { Droplets, ExternalLink, Menu, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface HeaderProps {
  isCalculatorOpen: boolean;
  onOpenDocs?: () => void;
}

const Header = ({ isCalculatorOpen, onOpenDocs }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isCalculatorOpen
          ? "bg-background/95 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="container px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg water-gradient flex items-center justify-center">
              <Droplets className="w-5 h-5 text-primary-foreground" />
            </div>
            <span
              className={`font-display font-bold ${
                isCalculatorOpen ? "text-foreground" : "text-water-foam"
              }`}
            >
              Ponce Lab
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#modules"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isCalculatorOpen
                  ? "text-muted-foreground"
                  : "text-water-foam/80 hover:text-water-foam"
              }`}
            >
              Modules
            </a>
            <button
              onClick={onOpenDocs}
              className={`text-sm font-medium transition-colors inline-flex items-center gap-1 ${
                isCalculatorOpen
                  ? "text-muted-foreground hover:text-primary"
                  : "text-water-foam/80 hover:text-water-foam"
              }`}
            >
              <BookOpen className="w-3 h-3" />
              Docs
            </button>
            <a
              href="https://ponce.sdsu.edu/"
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-medium transition-colors inline-flex items-center gap-1 ${
                isCalculatorOpen
                  ? "text-muted-foreground hover:text-primary"
                  : "text-water-foam/80 hover:text-water-foam"
              }`}
            >
              Original Source
              <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X
                className={`w-5 h-5 ${
                  isCalculatorOpen ? "text-foreground" : "text-water-foam"
                }`}
              />
            ) : (
              <Menu
                className={`w-5 h-5 ${
                  isCalculatorOpen ? "text-foreground" : "text-water-foam"
                }`}
              />
            )}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/20">
            <nav className="flex flex-col gap-3">
              <a
                href="#modules"
                className={`text-sm font-medium py-2 ${
                  isCalculatorOpen
                    ? "text-muted-foreground"
                    : "text-water-foam/80"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Modules
              </a>
              <button
                onClick={() => {
                  onOpenDocs?.();
                  setMobileMenuOpen(false);
                }}
                className={`text-sm font-medium py-2 inline-flex items-center gap-1 ${
                  isCalculatorOpen
                    ? "text-muted-foreground"
                    : "text-water-foam/80"
                }`}
              >
                <BookOpen className="w-3 h-3" />
                Docs
              </button>
              <a
                href="https://ponce.sdsu.edu/"
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm font-medium py-2 inline-flex items-center gap-1 ${
                  isCalculatorOpen
                    ? "text-muted-foreground"
                    : "text-water-foam/80"
                }`}
              >
                Original Source
                <ExternalLink className="w-3 h-3" />
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
