import { useEffect, useRef } from "react";
import { trackEvent, MatomoEvent } from "../lib/matomo";

// Fires a one-time `engagement.section_view` event (action=section_view,
// name=<section id>) when each tracked section first scrolls into view
// (>=50% of viewport height). Uses IntersectionObserver so it works
// regardless of Lenis/GSAP/normal scroll. Each section fires once,
// producing per-section rows like name=hero, name=donate, name=testimonials.
export function useSectionTracking(sectionIds: string[]): void {
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const fired = firedRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (!id || fired.has(id)) continue;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            fired.add(id);
            trackEvent(MatomoEvent.category.engagement, MatomoEvent.action.sectionView, id);
          }
        }
      },
      { threshold: [0.5] }
    );

    const els: Element[] = [];
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
        els.push(el);
      }
    }

    return () => {
      for (const el of els) observer.unobserve(el);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIds.join("|")]);
}
