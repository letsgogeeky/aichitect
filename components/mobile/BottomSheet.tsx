"use client";

import { useRef, useState, useCallback } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** Heights as vh percentages. Default: [50, 92] */
  snapPoints?: [number, number];
  title?: string;
  children: React.ReactNode;
}

const DISMISS_THRESHOLD = 25; // % vh — drag below this snaps to closed

export default function BottomSheet({
  open,
  onClose,
  snapPoints = [50, 92],
  title,
  children,
}: BottomSheetProps) {
  // snapIndex resets to 0 naturally on each open: the component returns null
  // when closed, which unmounts and remounts it fresh.
  const [snapIndex, setSnapIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragDelta, setDragDelta] = useState(0);
  const dragStartY = useRef(0);

  const currentHeight = snapPoints[snapIndex];
  const displayHeight = dragging
    ? Math.max(10, currentHeight - (dragDelta / window.innerHeight) * 100)
    : currentHeight;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setDragging(true);
    setDragDelta(0);
  }, []);

  // No dragging guard needed — delta is only applied to displayHeight when dragging=true
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setDragDelta(e.touches[0].clientY - dragStartY.current);
  }, []);

  const onTouchEnd = useCallback(() => {
    setDragging(false);
    const heightAfterDrag = currentHeight - (dragDelta / window.innerHeight) * 100;

    if (heightAfterDrag < DISMISS_THRESHOLD) {
      onClose();
      setDragDelta(0);
      return;
    }

    const nearest = snapPoints.reduce((prev, curr) =>
      Math.abs(curr - heightAfterDrag) < Math.abs(prev - heightAfterDrag) ? curr : prev
    );
    setSnapIndex(snapPoints.indexOf(nearest));
    setDragDelta(0);
  }, [currentHeight, dragDelta, onClose, snapPoints]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 sm:hidden"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 flex flex-col sm:hidden rounded-t-2xl overflow-hidden"
        style={{
          height: `${displayHeight}vh`,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderBottom: "none",
          transition: dragging ? "none" : "height 280ms cubic-bezier(0.32, 0.72, 0, 1)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Drag handle */}
        <div
          className="flex-shrink-0 flex flex-col items-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="rounded-full"
            style={{ width: 36, height: 4, background: "var(--border-2)" }}
          />
          {title && (
            <div className="mt-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {title}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </>
  );
}
