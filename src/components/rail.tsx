"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// The .rail and .gallery rows scroll sideways with their scrollbar hidden. Touch can swipe them, but a
// mouse has no scrollbar to grab and a vertical wheel doesn't move a horizontal row, so this adds
// click-and-drag, and (for Rail) previous/next buttons. Layout and styling stay in globals.css.

const DRAG_THRESHOLD = 5;

// After a drag, glide on to the next card edge in the direction of travel. Plain scroll-snap would
// pick the nearest edge, which sends a short drag straight back to where it started.
function settle(el: HTMLElement, travelled: number) {
  const rowLeft = el.getBoundingClientRect().left;
  const padding = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
  const max = el.scrollWidth - el.clientWidth;
  const edges = [...el.children].map((child) =>
    Math.min(max, Math.max(0, child.getBoundingClientRect().left - rowLeft + el.scrollLeft - padding)),
  );
  const target = travelled > 0 ? edges.find((edge) => edge >= el.scrollLeft - 1) : edges.findLast((edge) => edge <= el.scrollLeft + 1);
  if (target === undefined) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollTo({ left: target, behavior: reduceMotion ? "auto" : "smooth" });
}

function useScrollRow() {
  const ref = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const [dragging, setDragging] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [measure]);

  const step = (direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: reduceMotion ? "auto" : "smooth" });
  };

  // Mouse only: touch and pen already scroll natively. Listeners live on window so the row never
  // captures the pointer, which would stop plain clicks from reaching the product links.
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    moved.current = false;
    if (!el || event.pointerType !== "mouse" || event.button !== 0 || el.scrollWidth <= el.clientWidth) return;

    const startX = event.clientX;
    const startLeft = el.scrollLeft;
    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - startX;
      if (!moved.current && Math.abs(dx) > DRAG_THRESHOLD) {
        moved.current = true;
        setDragging(true);
      }
      if (moved.current) el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (moved.current) settle(el, el.scrollLeft - startLeft);
      setDragging(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const dragStyle: CSSProperties | undefined = dragging
    ? { scrollSnapType: "none", cursor: "grabbing", userSelect: "none" } // free-scroll while dragging, snap again on release
    : undefined;

  const rowProps = {
    ref,
    onPointerDown,
    style: dragStyle,
    // A drag that ends over a product card must not also open it.
    onClickCapture: (event: React.MouseEvent) => {
      if (moved.current) {
        event.preventDefault();
        event.stopPropagation();
        moved.current = false;
      }
    },
    // Stops the browser starting a native image/link drag instead of ours.
    onDragStart: (event: React.DragEvent) => event.preventDefault(),
  };

  return { rowProps, step, atStart, atEnd, scrollable: !(atStart && atEnd) };
}

function Arrow({ direction, disabled, onClick }: { direction: 1 | -1; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm w-10 px-0"
      aria-label={direction === 1 ? "Scroll right" : "Scroll left"}
      disabled={disabled}
      onClick={onClick}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true">
        <path d={direction === 1 ? "M6 2.5 11.5 8 6 13.5" : "M10 2.5 4.5 8 10 13.5"} />
      </svg>
    </button>
  );
}

// A titled row of cards: heading, optional link, scroll buttons on wider screens, then the row.
export function Rail({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const { rowProps, step, atStart, atEnd, scrollable } = useScrollRow();

  return (
    <>
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="heading">{title}</h2>
        <div className="flex items-center gap-4">
          {scrollable && (
            <div className="hidden gap-2 md:flex">
              <Arrow direction={-1} disabled={atStart} onClick={() => step(-1)} />
              <Arrow direction={1} disabled={atEnd} onClick={() => step(1)} />
            </div>
          )}
          {action}
        </div>
      </div>
      <div className="rail" {...rowProps}>
        {children}
      </div>
    </>
  );
}

// A bare scroll row (the product photo gallery) that only needs mouse dragging.
export function DragRow({ className, children }: { className: string; children: ReactNode }) {
  const { rowProps } = useScrollRow();
  return (
    <div className={className} {...rowProps}>
      {children}
    </div>
  );
}
