import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string | ((t: number) => number);
  splitType?: "chars" | "words" | "lines" | "words, chars";
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  textAlign?: React.CSSProperties["textAlign"];
  animationType?: "default" | "3d-blur" | "assemble" | "drop";
  onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = "",
  delay = 20, // Reduced for "assemble" feel
  duration = 1.25,
  ease = "power3.out",
  splitType = "chars",
  from = {},
  to = {},
  threshold = 0.1,
  rootMargin = "-100px",
  tag = "p",
  textAlign = "center",
  animationType = "default",
  onLetterAnimationComplete,
}) => {
  const ref = useRef<HTMLElement>(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState<boolean>(false);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (document.fonts.status === "loaded") {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => setFontsLoaded(true));
    }
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      if (animationCompletedRef.current) return;

      const el = ref.current;

      const splitInstance = new GSAPSplitText(el, {
        type: splitType,
        linesClass: "split-line",
        wordsClass: "split-word",
        charsClass: "split-char",
      });

      let animationFrom = { ...from };
      let animationTo = { ...to };

      // Presets
      if (animationType === "assemble") {
        animationFrom = {
          opacity: 0,
          x: () => Math.random() * 600 - 300,
          y: () => Math.random() * 600 - 300,
          z: () => Math.random() * 1000 + 500,
          rotationX: () => Math.random() * 360,
          rotationY: () => Math.random() * 360,
          filter: "blur(0px)", // User wants clarity
          ...from,
        };
        animationTo = {
          opacity: 1,
          x: 0,
          y: 0,
          z: 0,
          rotationX: 0,
          rotationY: 0,
          autoAlpha: 1,
          ease: "expo.out",
          ...to,
        };
      } else if (animationType === "3d-blur") {
        animationFrom = {
          opacity: 0,
          rotationX: -90,
          z: -100,
          y: 40,
          filter: "blur(10px)",
          ...from,
        };
        animationTo = {
          opacity: 1,
          rotationX: 0,
          z: 0,
          y: 0,
          filter: "blur(0px)",
          transformOrigin: "50% 50% -50px",
          ...to,
        };
      } else if (animationType === "drop") {
        animationFrom = {
          opacity: 0,
          y: -200,
          rotationX: -40,
          ...from,
        };
        animationTo = {
          opacity: 1,
          y: 0,
          rotationX: 0,
          ease: "bounce.out",
          transformOrigin: "50% 100%",
          ...to,
        };
      }

      const targets = splitType.includes("chars") ? splitInstance.chars : splitInstance.words;

      gsap.fromTo(targets, animationFrom, {
        ...animationTo,
        duration,
        stagger: delay / 1000,
        scrollTrigger: {
          trigger: el,
          start: `top 90%`,
          once: true,
          onEnter: () => {
            // Ensure anything hidden (like original text nodes) stays hidden
            gsap.set(el, { opacity: 1, visibility: "visible" });
          },
        },
        onComplete: () => {
          animationCompletedRef.current = true;
          // Clear only animated transforms to prevent flicker, but KEEP layout props
          gsap.set(targets, { clearProps: "transform,opacity,filter" });
          onCompleteRef.current?.();
        },
        willChange: "transform, opacity",
        force3D: true,
      });

      return () => {
        splitInstance.revert();
      };
    },
    { dependencies: [text, fontsLoaded, animationType, className], scope: ref }
  );

  const Tag = (tag || "p") as React.ElementType;

  return (
    <Tag
      ref={ref}
      className={`split-parent overflow-visible inline-block whitespace-normal ${className}`}
      style={{
        textAlign,
        wordWrap: "break-word",
        willChange: "transform, opacity",
      }}
    >
      {text}
    </Tag>
  );
};

export default SplitText;
