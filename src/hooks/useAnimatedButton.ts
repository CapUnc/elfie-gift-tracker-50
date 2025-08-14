import { useState, useCallback } from 'react';

type ButtonState = 'idle' | 'loading' | 'success' | 'error';

export const useAnimatedButton = (onAction?: () => Promise<void> | void) => {
  const [state, setState] = useState<ButtonState>('idle');

  const execute = useCallback(async () => {
    if (state === 'loading') return;

    try {
      setState('loading');
      await onAction?.();
      setState('success');
      
      // Reset to idle after success animation
      setTimeout(() => setState('idle'), 1500);
    } catch (error) {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  }, [onAction, state]);

  const getVariant = () => {
    switch (state) {
      case 'loading': return 'loading';
      case 'success': return 'success';
      case 'error': return 'destructive';
      default: return 'default';
    }
  };

  const isDisabled = state === 'loading';

  return { state, execute, getVariant, isDisabled };
};