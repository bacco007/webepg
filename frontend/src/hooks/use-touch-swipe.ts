import { useCallback, useState } from "react";

interface TouchSwipeOptions {
  onSwipe?: (direction: "left" | "right") => void;
  threshold?: number;
}

export const useTouchSwipe = ({
  onSwipe,
  threshold = 50,
}: TouchSwipeOptions = {}) => {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setIsScrolling(false);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX === null || touchStartY === null) {
        return;
      }

      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;

      const deltaX = touchStartX - touchX;
      const deltaY = touchStartY - touchY;

      // If vertical scrolling is dominant, mark as scrolling
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        setIsScrolling(true);
      }
    },
    [touchStartX, touchStartY]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX === null || isScrolling) {
        setTouchStartX(null);
        setTouchStartY(null);
        setIsScrolling(false);
        return;
      }

      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchStartX - touchEndX;

      // If horizontal swipe is significant, trigger callback
      if (Math.abs(deltaX) > threshold) {
        const direction = deltaX > 0 ? "left" : "right";
        onSwipe?.(direction);
      }

      setTouchStartX(null);
      setTouchStartY(null);
    },
    [touchStartX, isScrolling, threshold, onSwipe]
  );

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
