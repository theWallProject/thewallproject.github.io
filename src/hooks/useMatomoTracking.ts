import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { initMatomo, trackPageView, trackEvent, MatomoEvent } from "../lib/matomo";

// mounted once inside <BrowserRouter>; bootstraps Matomo and tracks SPA
// route changes (pageviews) using the History Change trigger pattern
// documented in the Matomo React guide. Each route component is responsible
// for setting its own document.title; this hook only fires the pageview.
export function useMatomoTracking(): void {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    initMatomo();
  }, []);

  useEffect(() => {
    // /noooooo is the addon's uninstall landing page. Counting it as a site
    // pageview would inflate marketing traffic with visits from people who
    // just removed the extension, and the page fires its own uninstall event.
    if (location.pathname === "/noooooo") {
      isFirstRender.current = false;
      return;
    }

    trackPageView();
    isFirstRender.current = false;

    if (location.pathname === "/privacy") {
      trackEvent(MatomoEvent.category.engagement, MatomoEvent.action.privacyView);
    }
    if (location.pathname === "/stats") {
      trackEvent(MatomoEvent.category.engagement, MatomoEvent.action.statsView);
    }
  }, [location.pathname]);
}
