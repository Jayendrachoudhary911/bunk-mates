import { useEffect, useRef } from "react";

/**
 * Hook to close a drawer, modal, or dialog on device/browser back button click.
 * @param {boolean} isOpen - Active open state of the component.
 * @param {Function} onClose - Callback method to invoke when closing.
 */
export function useBackButtonClose(isOpen, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  
  const popStateTriggeredRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    popStateTriggeredRef.current = false;
    const uniqId = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Push a new state to the history stack with the unique ID
    window.history.pushState({ modalId: uniqId }, "");

    const handlePopState = () => {
      // If the state was popped, window.history.state?.modalId will no longer match this uniqId
      const currentModalId = window.history.state?.modalId;
      if (currentModalId !== uniqId) {
        popStateTriggeredRef.current = true;
        onCloseRef.current();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      
      // If we are closing programmatically (e.g. click overlay / save),
      // we must pop the history state we pushed to keep history clean.
      if (!popStateTriggeredRef.current) {
        if (window.history.state?.modalId === uniqId) {
          window.history.back();
        }
      }
    };
  }, [isOpen]);
}
