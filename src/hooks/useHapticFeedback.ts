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

  return { success, error, tap, swipe, vibrate };
};