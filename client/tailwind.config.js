/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dk-base': 'var(--dk-base)',
        'dk-surface': 'var(--dk-surface)',
        'dk-surface-2': 'var(--dk-surface-2)',
        'dk-border': 'var(--dk-border)',
        'dk-border-2': 'var(--dk-border-2)',
        'dk-text': 'var(--dk-text)',
        'dk-text-2': 'var(--dk-text-2)',
        'dk-text-3': 'var(--dk-text-3)',
        'dk-accent': 'var(--dk-accent)',
        'dk-accent-glow': 'var(--dk-accent-glow)',
        'dk-navbar': 'var(--dk-navbar)',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
      },
      fontSize : {
        'course-details-heading-small':['26px','36px'],
        'course-details-heading-large':['36px','44px'],
        'home-heading-small':['28px','34px'],
        'home-heading-large':['48px','56px'],
        'default':['15px','21px']

      },
      gridTemplateColumns: {
       'auto': 'repeat(auto-fit, minmax(200px, 1fr))',
       
      },
      spacing:{
        'section-height':'500px'
      },
      maxWidth:{
        'course-card':'424px'
      },
      boxShadow:{
        'custom-card':'0px 4px 15px 2px rgba(0,0,0,0.1)'
      }

    },
  },
  plugins: [],
}


