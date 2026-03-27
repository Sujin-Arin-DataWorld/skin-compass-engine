export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      // 불필요한 -moz-, -webkit- prefix 생성을 줄임
      // 최신 브라우저만 타겟 (SkinStrategyLab은 모던 브라우저 대상)
      overrideBrowserslist: [
        'last 2 Chrome versions',
        'last 2 Firefox versions',
        'last 2 Safari versions',
        'last 2 Edge versions',
        'iOS >= 15',
        'Android >= 10',
      ],
    },
  },
};
