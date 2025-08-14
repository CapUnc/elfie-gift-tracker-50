import React, { useState, useRef } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RippleButtonProps extends ButtonProps {
  rippleColor?: string;
}

export const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ children, className, rippleColor = 'rgba(255, 255, 255, 0.6)', onClick, ...props }, ref) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const nextRippleId = useRef(0);

    const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      const newRipple = {
        x,
        y,
        id: nextRippleId.current++,
      };

      setRipples(prev => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      createRipple(event);
      onClick?.(event);
    };

    return (
      <Button
        ref={buttonRef}
        className={cn('relative overflow-hidden', className)}
        onClick={handleClick}
        {...props}
      >
        {children}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute animate-ripple rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: Math.max(buttonRef.current?.offsetWidth || 0, buttonRef.current?.offsetHeight || 0),
              height: Math.max(buttonRef.current?.offsetWidth || 0, buttonRef.current?.offsetHeight || 0),
              backgroundColor: rippleColor,
            }}
          />
        ))}
      </Button>
    );
  }
);

RippleButton.displayName = 'RippleButton';