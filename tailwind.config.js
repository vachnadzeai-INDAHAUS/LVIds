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
          DEFAULT: '#F97316',    // სტაფილოსფერი (Orange)
          light: '#FB923C',      // ღია სტაფილოსფერი
          dark: '#EA580C',       // მუქი სტაფილოსფერი
        },
        surface: {
          DEFAULT: '#1F2937',    // მუქი ნაცრისფერი (Dark Gray)
          light: '#374151',      // ღია ნაცრისფერი
          dark: '#111827',       // ძალიან მუქი
        },
        // ტექსტის ფერები
        text: {
          primary: '#F3F4F6',    // თეთრი/ღია (Primary text)
          secondary: '#9CA3AF',  // ნაცრისფერი (Secondary text)
          muted: '#6B7280',      // მუქი ნაცრისფერი
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
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
      },
    },
  },
  plugins: [],
};
