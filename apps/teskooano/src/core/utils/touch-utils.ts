/**
 * Simple Touch Utility for adding touch support to any element
 * This prevents ghost clicks and provides proper touch feedback
 */

export interface TouchOptions {
  /** Add visual feedback on touch */
  visualFeedback?: boolean;
  /** Maximum movement allowed during touch (px) */
  maxMove?: number;
  /** Minimum touch duration (ms) */
  minDuration?: number;
  /** Maximum touch duration (ms) */
  maxDuration?: number;
}

/**
 * Adds touch support to an element alongside click events
 * This prevents the 300ms delay and ghost clicks on mobile
 */
export function addTouchSupport(
  element: HTMLElement,
  clickHandler: (event: Event) => void,
  options: TouchOptions = {}
): () => void {
  const opts = {
    visualFeedback: true,
    maxMove: 10,
    minDuration: 50,
    maxDuration: 1000,
    ...options,
  };

  let isTouch = false;
  let touchStartTime = 0;
  let touchStartPos: { x: number; y: number } | null = null;

  const handleTouchStart = (event: TouchEvent) => {
    isTouch = true;
    touchStartTime = Date.now();
    
    const touch = event.touches[0];
    touchStartPos = { x: touch.clientX, y: touch.clientY };
    
    if (opts.visualFeedback) {
      element.classList.add('touch-active');
    }
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (!touchStartPos) return;
    
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > opts.maxMove) {
      // Cancel touch if moved too far
      if (opts.visualFeedback) {
        element.classList.remove('touch-active');
      }
      touchStartPos = null;
    }
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (opts.visualFeedback) {
      element.classList.remove('touch-active');
    }
    
    if (!touchStartPos) return;
    
    const touchDuration = Date.now() - touchStartTime;
    
    if (touchDuration >= opts.minDuration && touchDuration <= opts.maxDuration) {
      event.preventDefault();
      event.stopPropagation();
      clickHandler(event);
    }
    
    touchStartPos = null;
    
    // Reset isTouch flag after delay to prevent ghost clicks
    setTimeout(() => {
      isTouch = false;
    }, 300);
  };

  const handleClick = (event: MouseEvent) => {
    // If this came from a touch, ignore it
    if (isTouch) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    
    // Normal click for non-touch devices
    clickHandler(event);
  };

  // Add event listeners
  element.addEventListener('touchstart', handleTouchStart, { passive: false });
  element.addEventListener('touchmove', handleTouchMove, { passive: false });
  element.addEventListener('touchend', handleTouchEnd, { passive: false });
  element.addEventListener('click', handleClick);

  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
    element.removeEventListener('click', handleClick);
    
    if (opts.visualFeedback) {
      element.classList.remove('touch-active');
    }
  };
}

/**
 * Enhanced version that also handles the button-activated event for teskooano-button
 */
export function addButtonTouchSupport(
  button: HTMLElement,
  clickHandler: (event: Event) => void,
  options?: TouchOptions
): () => void {
  // Handle both regular clicks and button-activated events
  const handleActivation = (event: Event) => {
    clickHandler(event);
  };

  // Add touch support
  const cleanupTouch = addTouchSupport(button, handleActivation, options);
  
  // Also listen for button-activated events (for teskooano-button components)
  button.addEventListener('button-activated', handleActivation);
  
  return () => {
    cleanupTouch();
    button.removeEventListener('button-activated', handleActivation);
  };
}