import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useTranslation } from "react-i18next";
import styles from "./LanguageSwitcher.module.css";

const LanguageSwitcher: React.FC = () => {
  const {
    currentLanguage,
    changeLanguage,
    availableLanguages,
    detectedLanguage,
  } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLButtonElement[]>([]);

  const currentLanguageConfig = availableLanguages[currentLanguage];
  const languageCodes = Object.keys(availableLanguages) as Array<
    keyof typeof availableLanguages
  >;

  // Check if current language is different from detected language
  const hasDetectedLanguage =
    detectedLanguage && detectedLanguage !== currentLanguage;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) {
        if (
          event.key === "Enter" ||
          event.key === " " ||
          event.key === "ArrowDown"
        ) {
          event.preventDefault();
          setIsOpen(true);
          setFocusedIndex(0);
        }
        return;
      }

      switch (event.key) {
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          buttonRef.current?.focus();
          break;
        case "ArrowDown":
          event.preventDefault();
          setFocusedIndex((prev) =>
            prev < languageCodes.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : languageCodes.length - 1
          );
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          if (focusedIndex >= 0) {
            handleLanguageSelect(languageCodes[focusedIndex]);
          }
          break;
        case "Tab":
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, focusedIndex, languageCodes]);

  // Focus management
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionsRef.current[focusedIndex]) {
      optionsRef.current[focusedIndex].focus();
    }
  }, [focusedIndex, isOpen]);

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      setFocusedIndex(-1);
    } else {
      setIsOpen(true);
      setFocusedIndex(0);
    }
  };

  const handleLanguageSelect = (
    languageCode: keyof typeof availableLanguages
  ) => {
    changeLanguage(languageCode);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleOptionFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleOptionBlur = () => {
    // Don't reset focusedIndex on blur to maintain keyboard navigation
  };

  return (
    <div className={styles.languageSwitcherContainer} ref={dropdownRef}>
      <button
        ref={buttonRef}
        className={styles.languageSwitcher}
        onClick={handleToggle}
        aria-label={t("language.switcher.aria.label", {
          language: currentLanguageConfig.name,
        })}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        <span className={styles.languageInfo}>
          {currentLanguageConfig.flag} {currentLanguageConfig.nativeName}
          {hasDetectedLanguage && (
            <span
              className={styles.detectedIndicator}
              title="Detected from browser"
            >
              🌐
            </span>
          )}
        </span>
        <span
          className={`${styles.dropdownArrow} ${isOpen ? styles.rotated : ""}`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          className={styles.dropdownMenu}
          role="listbox"
          aria-label={t("language.switcher.aria.listbox")}
        >
          {languageCodes.map((languageCode, index) => {
            const languageConfig = availableLanguages[languageCode];
            const isSelected = languageCode === currentLanguage;
            const isFocused = index === focusedIndex;
            const isDetected = languageCode === detectedLanguage;

            return (
              <button
                key={languageCode}
                ref={(el) => {
                  if (el) optionsRef.current[index] = el;
                }}
                className={`${styles.languageOption} ${
                  isSelected ? styles.selected : ""
                } ${isFocused ? styles.focused : ""} ${
                  isDetected ? styles.detected : ""
                }`}
                onClick={() => handleLanguageSelect(languageCode)}
                onFocus={() => handleOptionFocus(index)}
                onBlur={handleOptionBlur}
                role="option"
                aria-selected={isSelected}
                aria-label={
                  isSelected
                    ? t("language.switcher.aria.selected", {
                        language: languageConfig.name,
                      })
                    : t("language.switcher.aria.option", {
                        language: languageConfig.name,
                      })
                }
              >
                <span className={styles.languageInfo}>
                  {languageConfig.flag} {languageConfig.nativeName}
                  {isDetected && (
                    <span
                      className={styles.detectedBadge}
                      title="Detected from browser"
                    >
                      🌐
                    </span>
                  )}
                </span>
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
