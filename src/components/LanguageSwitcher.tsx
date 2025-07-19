import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import styles from "./LanguageSwitcher.module.css";

const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguageConfig = availableLanguages[currentLanguage];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleLanguageSelect = (
    languageCode: keyof typeof availableLanguages
  ) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };

  const languageCodes = Object.keys(availableLanguages) as Array<
    keyof typeof availableLanguages
  >;

  return (
    <div className={styles.languageSwitcherContainer} ref={dropdownRef}>
      <button
        className={styles.languageSwitcher}
        onClick={handleToggle}
        aria-label={`Select language. Current: ${currentLanguageConfig.name}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {currentLanguageConfig.flag} {currentLanguageConfig.nativeName}
        <span className={styles.dropdownArrow}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu} role="listbox">
          {languageCodes.map((languageCode) => {
            const languageConfig = availableLanguages[languageCode];
            const isSelected = languageCode === currentLanguage;

            return (
              <button
                key={languageCode}
                className={`${styles.languageOption} ${
                  isSelected ? styles.selected : ""
                }`}
                onClick={() => handleLanguageSelect(languageCode)}
                role="option"
                aria-selected={isSelected}
              >
                {languageConfig.flag} {languageConfig.nativeName}
                {isSelected && <span className={styles.checkmark}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
