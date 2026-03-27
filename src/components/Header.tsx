import React, { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[1000] py-4 transition-all duration-500 ${
        isScrolled ? 'bg-[#000]/80 backdrop-blur-xl border-b border-white/5 py-2' : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-10 flex justify-between items-center w-full">
        
        {/* Logo Section - Small */}
        <div className="flex-shrink-0">
          <img
            src="/files/common/logo-white.svg"
            alt="The Wall Logo"
            className={`${isScrolled ? 'w-20' : 'w-24'} h-auto transition-all duration-500 opacity-90 hover:opacity-100`}
          />
        </div>

        {/* Global Navigation - Minimal and Ultra-Compact */}
        <div className="flex items-center gap-10">
          <nav className="hidden sm:flex items-center gap-8">
            <a href="#work" className="text-white/60 font-serif text-[0.8rem] hover:text-white transition-colors uppercase tracking-[0.2em]">Work</a>
            <a href="#about" className="text-white/60 font-serif text-[0.8rem] hover:text-white transition-colors uppercase tracking-[0.2em]">About</a>
          </nav>
          
          <div className="flex items-center gap-6 border-l border-white/10 pl-6 h-4">
             <LanguageSwitcher isScrolled={isScrolled} />
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
