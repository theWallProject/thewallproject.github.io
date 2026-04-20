import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const JUMP_THRESHOLD = 150;

export function useScrollDebugger() {
  useEffect(() => {
    let lastY = window.scrollY;
    let lastTime = performance.now();
    let rafId: number | null = null;

    const checkJump = () => {
      const currentY = window.scrollY;
      const now = performance.now();
      const dt = now - lastTime;
      const delta = currentY - lastY;
      const speed = dt > 0 ? Math.abs(delta / dt) : 0;

      if (Math.abs(delta) > JUMP_THRESHOLD && dt < 500) {
        console.warn(
          `%c[SCROLL-JUMP] delta=${delta}px in ${dt.toFixed(0)}ms (speed=${speed.toFixed(1)}px/ms) ${delta < 0 ? "⬆ UP" : "⬇ DOWN"} from=${lastY} to=${currentY}`,
          "background:#ff0000;color:#fff;font-size:14px;"
        );
        console.warn(
          "[SCROLL-JUMP] All ScrollTriggers:",
          ScrollTrigger.getAll().map(
            (st: {
              vars: { trigger?: HTMLElement };
              progress: number;
              direction: number;
              start: number;
              end: number;
              pin?: boolean | string;
            }) => ({
              trigger: (st.vars.trigger as HTMLElement)?.id || (st.vars.trigger as HTMLElement)?.tagName,
              progress: st.progress.toFixed(4),
              direction: st.direction,
              start: st.start,
              end: st.end,
              pin: !!st.pin,
            })
          )
        );
      }

      lastY = currentY;
      lastTime = now;
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          checkJump();
          rafId = null;
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    console.warn("[ScrollDebugger] Initialized — monitoring for jumps >", JUMP_THRESHOLD, "px");

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);
}
