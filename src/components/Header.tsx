import { Droplets, ExternalLink, Menu, X, BookOpen, Moon, Sun, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HeaderProps {
  isCalculatorOpen: boolean;
  onOpenDocs?: () => void;
}

const THEMES = [
  { id: "default", label: "Ponce Lab", short: "Default" },
  { id: "sdsu", label: "San Diego State", short: "SDSU" },
  { id: "uf", label: "U. of Florida", short: "UF" },
  { id: "osu", label: "Oregon State", short: "OSU" },
  { id: "auburn", label: "Auburn University", short: "Auburn" },
  { id: "epa", label: "EPA", short: "EPA" },
] as const;

type ThemeId = typeof THEMES[number]["id"];

const Header = ({ isCalculatorOpen, onOpenDocs }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("uni-theme") as ThemeId) || "default";
    }
    return "default";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setIsDark(true);
    else if (savedTheme === "light") setIsDark(false);
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setIsDark(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    THEMES.forEach(t => { if (t.id !== "default") root.classList.remove(`theme-${t.id}`); });
    // Apply selected
    if (themeId !== "default") root.classList.add(`theme-${themeId}`);
    localStorage.setItem("uni-theme", themeId);
  }, [themeId]);

  const toggleTheme = () => setIsDark(!isDark);
  const currentTheme = THEMES.find(t => t.id === themeId)!;

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
            <span className={`font-display font-bold ${isCalculatorOpen ? "text-foreground" : "text-water-foam"}`}>
              Ponce Lab
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-4">
            <a href="#modules" className={`text-sm font-medium transition-colors hover:text-primary ${isCalculatorOpen ? "text-muted-foreground" : "text-water-foam/80 hover:text-water-foam"}`}>
              Modules
            </a>
            <button onClick={onOpenDocs} className={`text-sm font-medium transition-colors inline-flex items-center gap-1 ${isCalculatorOpen ? "text-muted-foreground hover:text-primary" : "text-water-foam/80 hover:text-water-foam"}`}>
              <BookOpen className="w-3 h-3" />Docs
            </button>
            <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className={`text-sm font-medium transition-colors inline-flex items-center gap-1 ${isCalculatorOpen ? "text-muted-foreground hover:text-primary" : "text-water-foam/80 hover:text-water-foam"}`}>
              Source <ExternalLink className="w-3 h-3" />
            </a>

            {/* Theme Selector */}
            <Select value={themeId} onValueChange={(v) => setThemeId(v as ThemeId)}>
              <SelectTrigger className={`w-[120px] h-8 text-xs border-0 bg-transparent ${isCalculatorOpen ? "text-muted-foreground" : "text-water-foam/80"}`}>
                <Palette className="w-3 h-3 mr-1" />
                <SelectValue>{currentTheme.short}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {THEMES.map(t => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="ghost" size="icon" onClick={toggleTheme} className={`transition-all duration-300 ${isCalculatorOpen ? "text-muted-foreground hover:text-primary" : "text-water-foam/80 hover:text-water-foam"}`} aria-label="Toggle theme">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </nav>

          {/* Mobile */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className={`w-5 h-5 ${isCalculatorOpen ? "text-foreground" : "text-water-foam"}`} /> : <Menu className={`w-5 h-5 ${isCalculatorOpen ? "text-foreground" : "text-water-foam"}`} />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/20">
            <nav className="flex flex-col gap-3">
              <a href="#modules" className={`text-sm font-medium py-2 ${isCalculatorOpen ? "text-muted-foreground" : "text-water-foam/80"}`} onClick={() => setMobileMenuOpen(false)}>Modules</a>
              <button onClick={() => { onOpenDocs?.(); setMobileMenuOpen(false); }} className={`text-sm font-medium py-2 inline-flex items-center gap-1 ${isCalculatorOpen ? "text-muted-foreground" : "text-water-foam/80"}`}>
                <BookOpen className="w-3 h-3" />Docs
              </button>
              <div className="flex items-center gap-2 py-2">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <Select value={themeId} onValueChange={(v) => setThemeId(v as ThemeId)}>
                  <SelectTrigger className="h-8 text-xs flex-1"><SelectValue>{currentTheme.label}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {THEMES.map(t => (<SelectItem key={t.id} value={t.id} className="text-xs">{t.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <button onClick={toggleTheme} className={`text-sm font-medium py-2 inline-flex items-center gap-2 ${isCalculatorOpen ? "text-muted-foreground" : "text-water-foam/80"}`}>
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}{isDark ? "Light Mode" : "Dark Mode"}
              </button>
              <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className={`text-sm font-medium py-2 inline-flex items-center gap-1 ${isCalculatorOpen ? "text-muted-foreground" : "text-water-foam/80"}`}>
                Original Source <ExternalLink className="w-3 h-3" />
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
