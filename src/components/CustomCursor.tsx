import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const CustomCursor: React.FC = () => {
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorOutlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = cursorDotRef.current;
    const outline = cursorOutlineRef.current;

    const onMouseMove = (e: MouseEvent) => {
      // Small dot follows mouse exactly
      gsap.to(dot, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
      });

      // Larger outline follows with slight delay
      gsap.to(outline, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.5,
        ease: "power3.out",
      });
    };

    const onMouseEnterLink = () => {
      gsap.to(outline, {
        scale: 2.5,
        backgroundColor: "rgba(255, 255, 255, 1)",
        duration: 0.3,
      });
      gsap.to(dot, {
        scale: 0,
        duration: 0.3,
      });
    };

    const onMouseLeaveLink = () => {
      gsap.to(outline, {
        scale: 1,
        backgroundColor: "transparent",
        duration: 0.3,
      });
      gsap.to(dot, {
        scale: 1,
        duration: 0.3,
      });
    };

    window.addEventListener("mousemove", onMouseMove);

    // Add listeners to all interactive elements
    const interactiveElements = document.querySelectorAll("a, button, iframe, .interactive");
    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", onMouseEnterLink);
      el.addEventListener("mouseleave", onMouseLeaveLink);
    });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseenter", onMouseEnterLink);
        el.removeEventListener("mouseleave", onMouseLeaveLink);
      });
    };
  }, []);

  return (
    <>
      <div
        ref={cursorDotRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference -translate-x-1/2 -translate-y-1/2"
      />
      <div
        ref={cursorOutlineRef}
        className="fixed top-0 left-0 w-8 h-8 border border-white/50 rounded-full pointer-events-none z-[9998] mix-blend-difference -translate-x-1/2 -translate-y-1/2"
      />
    </>
  );
};

export default CustomCursor;
