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
    trackPageView();
    isFirstRender.current = false;

    if (location.pathname === "/privacy") {
      trackEvent(MatomoEvent.category.engagement, MatomoEvent.action.privacyView);
    }
  }, [location.pathname]);
}
