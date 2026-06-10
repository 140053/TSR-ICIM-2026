const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
  theme: {
    extend: {
      fontFamily: {
        cinzel: ["var(--font-cinzel)"],
        nunito: ["var(--font-nunito)"],
        "dm-sans": ["var(--font-dm-sans)"],
      },
    },
  },
};

export default config;
