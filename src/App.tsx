import { useTranslation } from "react-i18next";
import { LanguageProvider } from "./contexts/LanguageContext";
import LanguageSwitcher from "./components/LanguageSwitcher";
import "./App.css";

// Import i18n configuration
import "./i18n";

function AppContent() {
  const { t } = useTranslation();

  return (
    <div className="App">
      <LanguageSwitcher />
      <header className="App-header">
        <h1>{t("header.title")}</h1>
        <p>{t("intro.text", { count: 19000 })}</p>
      </header>
      <main>
        <section className="downloads">
          <h2>Downloads</h2>
          <div className="download-grid">
            <div className="download-item">
              <h3>{t("downloads.chrome.title")}</h3>
              <p>{t("downloads.chrome.subtitle")}</p>
            </div>
            <div className="download-item">
              <h3>{t("downloads.firefox.title")}</h3>
              <p>{t("downloads.firefox.subtitle")}</p>
            </div>
            <div className="download-item">
              <h3>{t("downloads.safari.title")}</h3>
            </div>
            <div className="download-item">
              <h3>{t("downloads.ios.title")}</h3>
              <p>{t("downloads.ios.subtitle")}</p>
            </div>
            <div className="download-item">
              <h3>{t("downloads.telegram.title")}</h3>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="feature">
            <h3>{t("features.installOnce.title")}</h3>
            <p>{t("features.installOnce.description")}</p>
          </div>
          <div className="feature">
            <h3>{t("features.worksEverywhere.title")}</h3>
            <p>{t("features.worksEverywhere.description")}</p>
          </div>
          <div className="feature">
            <h3>{t("features.smartDetection.title")}</h3>
            <p>{t("features.smartDetection.description")}</p>
          </div>
          <div className="feature">
            <h3>{t("features.trustedData.title")}</h3>
            <p>{t("features.trustedData.description")}</p>
          </div>
        </section>
      </main>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
