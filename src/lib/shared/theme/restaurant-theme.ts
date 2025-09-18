import { Injectable } from '@angular/core';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

@Injectable({
  providedIn: 'root'
})
export class RestaurantThemeService {
  
  /**
   * Creates a custom PrimeNG theme for the restaurant
   */
  createRestaurantTheme(colors: {
    primary: string;
    secondary: string;
    accent: string;
    surface: string;
    text: string;
  }) {
    return definePreset(Aura, {
      semantic: {
        primary: {
          50: this.lighten(colors.primary, 0.95),
          100: this.lighten(colors.primary, 0.9),
          200: this.lighten(colors.primary, 0.8),
          300: this.lighten(colors.primary, 0.6),
          400: this.lighten(colors.primary, 0.4),
          500: colors.primary,
          600: this.darken(colors.primary, 0.1),
          700: this.darken(colors.primary, 0.2),
          800: this.darken(colors.primary, 0.3),
          900: this.darken(colors.primary, 0.4),
          950: this.darken(colors.primary, 0.5)
        },
        colorScheme: {
          light: {
            primary: {
              color: colors.primary,
              inverseColor: '#ffffff',
              hoverColor: this.darken(colors.primary, 0.1),
              activeColor: this.darken(colors.primary, 0.2)
            },
            surface: {
              0: '#ffffff',
              50: '#fafafa',
              100: '#f5f5f5',
              200: '#eeeeee',
              300: '#e0e0e0',
              400: '#bdbdbd',
              500: '#9e9e9e',
              600: '#757575',
              700: '#616161',
              800: '#424242',
              900: '#212121',
              950: '#121212'
            }
          },
          dark: {
            primary: {
              color: this.lighten(colors.primary, 0.2),
              inverseColor: '#1a1a1a',
              hoverColor: this.lighten(colors.primary, 0.3),
              activeColor: this.lighten(colors.primary, 0.4)
            },
            surface: {
              0: '#121212',
              50: '#1a1a1a',
              100: '#2a2a2a',
              200: '#3a3a3a',
              300: '#4a4a4a',
              400: '#5a5a5a',
              500: '#6a6a6a',
              600: '#7a7a7a',
              700: '#8a8a8a',
              800: '#9a9a9a',
              900: '#aaaaaa',
              950: '#ffffff'
            }
          }
        }
      }
    });
  }

  /**
   * Lighten a color by a percentage
   */
  private lighten(color: string, percent: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;
    
    const { r, g, b } = rgb;
    const newR = Math.round(r + (255 - r) * percent);
    const newG = Math.round(g + (255 - g) * percent);
    const newB = Math.round(b + (255 - b) * percent);
    
    return this.rgbToHex(newR, newG, newB);
  }

  /**
   * Darken a color by a percentage
   */
  private darken(color: string, percent: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;
    
    const { r, g, b } = rgb;
    const newR = Math.round(r * (1 - percent));
    const newG = Math.round(g * (1 - percent));
    const newB = Math.round(b * (1 - percent));
    
    return this.rgbToHex(newR, newG, newB);
  }

  /**
   * Convert hex to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Convert RGB to hex
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  /**
   * Get predefined restaurant themes
   */
  getPresetThemes() {
    return {
      classic: {
        primary: '#8B4513',    // Saddle Brown
        secondary: '#D2691E',  // Chocolate
        accent: '#FFD700',     // Gold
        surface: '#F5F5DC',    // Beige
        text: '#2F1B14'        // Dark Brown
      },
      modern: {
        primary: '#2C3E50',    // Dark Blue Gray
        secondary: '#34495E',  // Wet Asphalt
        accent: '#E74C3C',     // Alizarin
        surface: '#ECF0F1',    // Clouds
        text: '#2C3E50'        // Dark Blue Gray
      },
      vibrant: {
        primary: '#E91E63',    // Pink
        secondary: '#9C27B0',  // Purple
        accent: '#FF9800',     // Orange
        surface: '#FAFAFA',    // Light Gray
        text: '#212121'        // Dark Gray
      },
      earthy: {
        primary: '#795548',    // Brown
        secondary: '#8BC34A',  // Light Green
        accent: '#FF5722',     // Deep Orange
        surface: '#F1F8E9',    // Light Green
        text: '#3E2723'        // Dark Brown
      },
      elegant: {
        primary: '#37474F',    // Blue Gray
        secondary: '#546E7A',  // Blue Gray
        accent: '#FFC107',     // Amber
        surface: '#FAFAFA',    // Light Gray
        text: '#263238'        // Dark Blue Gray
      }
    };
  }
}

/**
 * Tailwind CSS utilities for restaurant theming
 */
export const RESTAURANT_TAILWIND_CLASSES = {
  // Layout & Spacing
  container: 'container mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-8 sm:py-12 lg:py-16',
  card: 'bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300',
  cardPadding: 'p-4 sm:p-6',
  
  // Typography
  heading: {
    h1: 'text-3xl sm:text-4xl lg:text-5xl font-bold',
    h2: 'text-2xl sm:text-3xl lg:text-4xl font-semibold',
    h3: 'text-xl sm:text-2xl lg:text-3xl font-medium',
    h4: 'text-lg sm:text-xl font-medium',
    h5: 'text-base sm:text-lg font-medium',
    h6: 'text-sm sm:text-base font-medium'
  },
  
  body: {
    large: 'text-lg leading-relaxed',
    base: 'text-base leading-relaxed',
    small: 'text-sm leading-relaxed',
    xs: 'text-xs leading-relaxed'
  },
  
  // Buttons
  button: {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
    success: 'bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2',
    danger: 'bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
    ghost: 'text-primary-600 hover:text-primary-700 hover:bg-primary-50 font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
  },
  
  // Forms
  form: {
    input: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200',
    label: 'block text-sm font-medium text-gray-700 mb-2',
    error: 'text-red-600 text-sm mt-1',
    helper: 'text-gray-500 text-sm mt-1'
  },
  
  // Status Colors
  status: {
    pending: 'text-yellow-700 bg-yellow-100',
    preparing: 'text-blue-700 bg-blue-100',
    ready: 'text-green-700 bg-green-100',
    completed: 'text-gray-700 bg-gray-100',
    cancelled: 'text-red-700 bg-red-100'
  },
  
  // Animations
  animation: {
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    bounce: 'animate-bounce'
  },
  
  // Mobile Optimizations
  mobile: {
    touchTarget: 'min-h-[44px] min-w-[44px]', // 44px minimum for touch targets
    safeArea: 'pb-safe-bottom pt-safe-top',
    scrollable: 'overflow-y-auto -webkit-overflow-scrolling-touch'
  },
  
  // Responsive Grid
  grid: {
    responsive: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6',
    menu: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
    dashboard: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
  }
};

/**
 * Animation keyframes for custom animations
 */
export const CUSTOM_ANIMATIONS = `
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
  
  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }
`;
