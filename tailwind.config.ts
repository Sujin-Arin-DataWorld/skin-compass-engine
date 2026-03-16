import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '1.5rem',
  		screens: {
  			'2xl': '960px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			display: [
  				'Cormorant Garamond',
  				'Georgia',
  				'serif'
  			],
  			body: [
  				'DM Sans',
  				'system-ui',
  				'sans-serif'
  			],
  			sans: [
  				'Roboto',
  				'ui-sans-serif',
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Helvetica Neue',
  				'Arial',
  				'Noto Sans',
  				'sans-serif'
  			],
  			serif: [
  				'Libre Caslon Text',
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'Roboto Mono',
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			]
  		},
  		fontSize: {
  			'display-xl': [
  				'clamp(3rem, 7vw, 6rem)',
  				{
  					lineHeight: '1.05',
  					letterSpacing: '-0.02em'
  				}
  			],
  			'display-lg': [
  				'clamp(2.2rem, 5vw, 4rem)',
  				{
  					lineHeight: '1.1',
  					letterSpacing: '-0.015em'
  				}
  			],
  			'display-md': [
  				'clamp(1.6rem, 3vw, 2.5rem)',
  				{
  					lineHeight: '1.2'
  				}
  			],
  			'body-lg': [
  				'1.125rem',
  				{
  					lineHeight: '1.7'
  				}
  			],
  			'body-md': [
  				'1rem',
  				{
  					lineHeight: '1.65'
  				}
  			],
  			label: [
  				'0.75rem',
  				{
  					lineHeight: '1.4',
  					letterSpacing: '0.1em'
  				}
  			]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			'foreground-body': 'hsl(var(--foreground-body))',
  			'foreground-hint': 'hsl(var(--foreground-hint))',
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
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
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
  				foreground: 'hsl(var(--accent-foreground))',
  				gold: 'hsl(var(--accent-gold))',
  				'gold-foreground': 'hsl(var(--accent-gold-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
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
  			},
  			sand: {
  				DEFAULT: 'hsl(var(--accent-sand))'
  			},
  			champagne: {
  				DEFAULT: 'hsl(var(--accent-champagne))'
  			},
  			rose: {
  				DEFAULT: 'hsl(var(--accent-rose))'
  			},
  			'severity-clear': 'hsl(var(--severity-clear))',
  			'severity-mild': 'hsl(var(--severity-mild))',
  			'severity-moderate': 'hsl(var(--severity-moderate))',
  			'severity-severe': 'hsl(var(--severity-severe))'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
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
  			'pulse-glow': {
  				'0%, 100%': {
  					opacity: '0.4'
  				},
  				'50%': {
  					opacity: '1'
  				}
  			}
  		},
  		transitionTimingFunction: {
  			spring: 'cubic-bezier(0.22,1,0.36,1)',
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
  		},
  		boxShadow: {
  			'2xs': 'var(--shadow-2xs)',
  			xs: 'var(--shadow-xs)',
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  			'2xl': 'var(--shadow-2xl)',
  			'inner-highlight': 'inset 0 1px 1px rgba(255,255,255,0.4)',
  			'gold-glow': '0 0 20px rgba(210,172,71,0.15)',
  			'gold-glow-dark': '0 0 20px rgba(254,189,17,0.25)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
