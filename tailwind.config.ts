import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				christmas: {
					red: 'hsl(var(--christmas-red))',
					'red-light': 'hsl(var(--christmas-red-light))',
					green: 'hsl(var(--christmas-green))',
					'green-light': 'hsl(var(--christmas-green-light))',
					gold: 'hsl(var(--christmas-gold))',
					'gold-light': 'hsl(var(--christmas-gold-light))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			backgroundImage: {
				'gradient-festive': 'var(--gradient-festive)',
				'gradient-subtle': 'var(--gradient-subtle)'
			},
			boxShadow: {
				'festive': 'var(--shadow-festive)',
				'card': 'var(--shadow-card)'
			},
			transitionProperty: {
				'smooth': 'var(--transition-smooth)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'arrow-rotate-down': {
					from: { transform: 'rotate(0deg)' },
					to: { transform: 'rotate(180deg)' }
				},
				'arrow-rotate-up': {
					from: { transform: 'rotate(180deg)' },
					to: { transform: 'rotate(0deg)' }
				},
				'highlight-pulse': {
					'0%': { backgroundColor: 'hsl(var(--christmas-gold) / 0.2)', transform: 'scale(1)' },
					'50%': { backgroundColor: 'hsl(var(--christmas-gold) / 0.4)', transform: 'scale(1.02)' },
					'100%': { backgroundColor: 'transparent', transform: 'scale(1)' }
				},
				'stagger-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'bounce-subtle': {
					'0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
					'40%': { transform: 'translateY(-4px)' },
					'60%': { transform: 'translateY(-2px)' }
				},
				'slide-in-bottom': {
					'0%': { transform: 'translateY(100%)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'ripple': {
					'0%': { transform: 'scale(0)', opacity: '1' },
					'100%': { transform: 'scale(4)', opacity: '0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'arrow-rotate-down': 'arrow-rotate-down 0.2s ease-out',
				'arrow-rotate-up': 'arrow-rotate-up 0.2s ease-out',
				'highlight-pulse': 'highlight-pulse 2s ease-out',
				'stagger-in': 'stagger-in 0.3s ease-out',
				'bounce-subtle': 'bounce-subtle 0.6s ease-out',
				'slide-in-bottom': 'slide-in-bottom 0.3s ease-out',
				'ripple': 'ripple 0.6s ease-out'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
