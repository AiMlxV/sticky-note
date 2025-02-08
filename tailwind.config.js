// ...existing config...
module.exports = {
  // ...other config options...
  theme: {
    extend: {
      // ...other extensions...
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out'
      },
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translate(-50%, 20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translate(-50%, 0)'
          }
        }
      }
    }
  }
  // ...rest of config...
};
