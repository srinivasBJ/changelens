'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Props {
  text: string;
  className?: string;
  isSelected?: boolean;
  isRowHovered?: boolean;
}

export const HoverScrollText: React.FC<Props> = ({
  text,
  className = '',
  isSelected = false,
  isRowHovered = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [isSelfHovered, setIsSelfHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Measure overflow distance whenever text changes or window resizes
  const measure = useCallback(() => {
    if (containerRef.current && textRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const textWidth = textRef.current.scrollWidth;
      const overflow = textWidth - containerWidth;
      setScrollDistance(overflow > 2 ? overflow : 0);
    }
  }, []);

  useEffect(() => {
    measure();
    // Delay measurement slightly to account for fonts / layout settling
    const timer = setTimeout(measure, 100);

    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [text, measure]);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const isActive = isSelfHovered || isRowHovered;
  const shouldScroll = scrollDistance > 0 && isActive && !prefersReducedMotion;

  // Calculate speed: comfortable reading speed (~55px/sec), min 1.2s, max 3.5s
  const duration = Math.min(3.5, Math.max(1.2, scrollDistance / 55));

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsSelfHovered(true)}
      onMouseLeave={() => setIsSelfHovered(false)}
      onFocus={() => setIsSelfHovered(true)}
      onBlur={() => setIsSelfHovered(false)}
      tabIndex={scrollDistance > 0 ? 0 : undefined}
      title={text}
      className="relative overflow-hidden min-w-0 flex-1 max-w-[280px] sm:max-w-[380px] md:max-w-[460px] lg:max-w-[500px] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#58A6FF] rounded-[2px]"
      aria-label={text}
    >
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap will-change-transform ${className}`}
        style={{
          transform: shouldScroll ? `translateX(-${scrollDistance}px)` : 'translateX(0px)',
          transition: prefersReducedMotion
            ? 'none'
            : isActive && scrollDistance > 0
            ? `transform ${duration}s cubic-bezier(0.25, 1, 0.5, 1) 200ms`
            : 'transform 300ms ease-out',
        }}
      >
        {text}
      </span>
    </div>
  );
};
