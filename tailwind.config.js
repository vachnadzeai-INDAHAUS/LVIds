/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // ჩვენი ფერების სქემა / Our color scheme
        primary: {
          DEFAULT: '#F97316',    // სტაფილოსფერი (40%)
          light: '#FB923C',      // ღია სტაფილოსფერი (30%)
          dark: '#EA580C',       // მუქი სტაფილოსფერი
        },
        surface: {
          DEFAULT: '#1F2937',    // ნაცრისფერი (30%)
          light: '#374151',      // ღია ნაცრისფერი
          dark: '#111827',       // მუქი ნაცრისფერი
        },
        // ტექსტის ფერები - ნაცრისფრად!
        text: {
          primary: '#F3F4F6',    // თეთრი (10%)
          secondary: '#9CA3AF',  // ნაცრისფერი - მთავარი ტექსტი
          muted: '#6B7280',      // მუქი ნაცრისფერი
        }
      },
      animation: {
        // ახალი ანიმაციები
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        // გადასვლის ეფექტების პრევიუ
        'transition-slide-left': 'slideLeft 0.5s ease-in-out',
        'transition-slide-right': 'slideRight 0.5s ease-in-out',
        'transition-fade': 'fadeTransition 0.5s ease-in-out',
        'transition-zoom': 'zoomTransition 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // გადასვლის ეფექტები
        slideLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        slideRight: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeTransition: {
          '0%': { opacity: '1' },
          '50%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        zoomTransition: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
    },
  },
  plugins: [],
};
