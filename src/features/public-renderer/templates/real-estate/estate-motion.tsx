"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import styles from "./estate-editorial.module.css";

export function EstateMotion({
  children,
  premium,
}: {
  children: ReactNode;
  premium: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          observer.unobserve(target);
          if (preference.matches || !target.animate) return;
          const animation = target.animate(
            [
              { opacity: 0.35, transform: "translateY(24px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 650, easing: "cubic-bezier(.2,.7,.2,1)" },
          );
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        });
      },
      { threshold: 0.12 },
    );
    root.current
      ?.querySelectorAll("section h2, article, [data-estate-reveal]")
      .forEach((element) => observer.observe(element));
    const stop = () => {
      if (preference.matches)
        animations.forEach((animation) => animation.cancel());
    };
    preference.addEventListener("change", stop);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", stop);
      animations.forEach((animation) => animation.cancel());
    };
  }, []);
  return (
    <div
      className={styles.experience}
      data-estate-tone={premium ? "premium" : "local"}
      ref={root}
    >
      {children}
    </div>
  );
}

export function EstateRail({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const move = (direction: number) =>
    rail.current?.scrollBy({
      left: direction * rail.current.clientWidth * 0.85,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  return (
    <div>
      <div className={styles.railTools}>
        <span>{label}</span>
        <div>
          <button
            type="button"
            title="Imóveis anteriores"
            aria-label="Imóveis anteriores"
            onClick={() => move(-1)}
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </button>
          <button
            type="button"
            title="Imóveis seguintes"
            aria-label="Imóveis seguintes"
            onClick={() => move(1)}
          >
            <ArrowRight aria-hidden="true" size={20} />
          </button>
        </div>
      </div>
      <div
        ref={rail}
        className={styles.rail}
        role="region"
        aria-label={label}
        tabIndex={0}
      >
        {children}
      </div>
    </div>
  );
}
