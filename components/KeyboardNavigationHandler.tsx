import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import KeyboardShortcutGuideModal from './KeyboardShortcutGuideModal';

export const KeyboardNavigationHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Esc Key: Go Back / Close Modal (matches browser Back button ←)
      if (e.key === 'Escape') {
        // If guide modal is open, close it
        if (isHelpOpen) {
          e.preventDefault();
          e.stopPropagation();
          setIsHelpOpen(false);
          return;
        }

        // Check if there is an active top-level modal dialog open
        const openModals = Array.from(document.querySelectorAll<HTMLElement>('.fixed.inset-0'));
        const visibleModal = openModals.reverse().find(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        });

        if (visibleModal) {
          const closeBtn = visibleModal.querySelector<HTMLButtonElement>(
            'button[title*="Close" i], button[aria-label*="Close" i], button:has(svg.lucide-x), button:has(svg)'
          );
          if (closeBtn) {
            e.preventDefault();
            e.stopPropagation();
            closeBtn.click();
            return;
          }
        }

        // If focus is in an input or select, blur it
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }

        // Otherwise: Trigger Go Back in history (matches browser Back button ←)
        e.preventDefault();
        e.stopPropagation();

        const canGoBack = window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0;
        if (canGoBack) {
          navigate(-1);
        } else {
          // Safe fallback navigation
          if (location.pathname === '/patients/register' || location.pathname === '/registration') {
            navigate('/patients');
          } else if (location.pathname !== '/' && location.pathname !== '/dashboard') {
            navigate('/dashboard');
          }
        }
        return;
      }

      // 2. F1 or Shift + ? -> Open Keyboard Shortcuts Guide
      if (e.key === 'F1' || (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((document.activeElement?.tagName || '')))) {
        e.preventDefault();
        e.stopPropagation();
        setIsHelpOpen(prev => !prev);
        return;
      }

      // 3. Ctrl + S / Cmd + S -> Quick Save Form
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        e.stopPropagation();
        const activeForm = document.querySelector('form') || document.getElementById('regForm');
        if (activeForm) {
          const submitBtn = activeForm.querySelector<HTMLButtonElement>('button[type="submit"]');
          if (submitBtn) {
            submitBtn.click();
          } else {
            activeForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        }
        return;
      }

      // Don't intercept function navigation keys if user is typing text with Alt
      const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');

      // 4. Function Keys Navigation (F2 - F10)
      if (e.key === 'F2' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        navigate('/patients/register');
        return;
      }

      if (e.key === 'F3' || (e.altKey && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        navigate('/patients');
        return;
      }

      if (e.key === 'F4' || (e.altKey && e.key.toLowerCase() === 'o')) {
        e.preventDefault();
        navigate('/opd');
        return;
      }

      if (e.key === 'F6' || (e.altKey && e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        navigate('/billing');
        return;
      }

      if (e.key === 'F7' || (e.altKey && e.key.toLowerCase() === 'r')) {
        e.preventDefault();
        navigate('/e-prescription');
        return;
      }

      if (e.key === 'F8' || (e.altKey && e.key.toLowerCase() === 'i')) {
        e.preventDefault();
        navigate('/ipd');
        return;
      }

      if (e.key === 'F9' || (e.altKey && e.key.toLowerCase() === 'l')) {
        e.preventDefault();
        navigate('/lab');
        return;
      }

      if (e.key === 'F10' || (e.altKey && e.key.toLowerCase() === 'm')) {
        e.preventDefault();
        navigate('/pharmacy');
        return;
      }

      // 5. Alt + H or Alt + D -> Dashboard
      if (e.altKey && (e.key.toLowerCase() === 'h' || e.key.toLowerCase() === 'd')) {
        e.preventDefault();
        navigate('/dashboard');
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isHelpOpen, location.pathname, navigate]);

  return (
    <KeyboardShortcutGuideModal
      isOpen={isHelpOpen}
      onClose={() => setIsHelpOpen(false)}
    />
  );
};

export default KeyboardNavigationHandler;
