import * as React from "react";

export type HyperTextProps = {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  as?: React.ElementType;
  startOnView?: boolean;
  animateOnHover?: boolean;
  characterSet?: string[];
};

const DEFAULT = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*<>[]{}".split("");

/**
 * MagicUI-compatible HyperText source kept with the portfolio for React/shadcn migrations.
 * The live static site uses the same scramble behavior in app.js so Vercel/GitHub Pages
 * deployment remains dependency-free.
 */
export function HyperText({
  children,
  className,
  duration = 800,
  delay = 0,
  as: Component = "span",
  startOnView = false,
  animateOnHover = true,
  characterSet = DEFAULT,
}: HyperTextProps) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [text, setText] = React.useState(children);
  const running = React.useRef(false);
  const animate = React.useCallback(() => {
    if (running.current) return;
    running.current = true;
    const started = performance.now() + delay;
    const frame = (now: number) => {
      if (now < started) return requestAnimationFrame(frame);
      const progress = Math.min(1, (now - started) / duration);
      const reveal = Math.floor(progress * children.length);
      setText(children.split("").map((char, i) => {
        if (char === " " || i < reveal) return char;
        return characterSet[Math.floor(Math.random() * characterSet.length)] ?? char;
      }).join(""));
      if (progress < 1) requestAnimationFrame(frame);
      else { setText(children); running.current = false; }
    };
    requestAnimationFrame(frame);
  }, [children, characterSet, delay, duration]);

  React.useEffect(() => {
    if (!startOnView) { animate(); return; }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { animate(); observer.disconnect(); }
    }, { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [animate, startOnView]);

  return React.createElement(Component, {
    ref,
    className,
    onPointerEnter: animateOnHover ? animate : undefined,
    children: text,
  });
}
