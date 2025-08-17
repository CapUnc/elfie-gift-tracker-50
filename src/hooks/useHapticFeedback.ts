export const useHapticFeedback = () => {
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const success = () => vibrate([50, 50, 50]);
  const error = () => vibrate([100, 50, 100]);
  const tap = () => vibrate(20);
  const swipe = () => vibrate(30);
  const impact = (style?: 'light' | 'medium' | 'heavy') => {
    // Map impact styles to vibration patterns
    switch (style) {
      case 'light': return vibrate(20);
      case 'medium': return vibrate(40);
      case 'heavy': return vibrate(60);
      default: return vibrate(30);
    }
  };

  return { success, error, tap, swipe, impact, vibrate };
};