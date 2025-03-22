module.exports = {
    theme: {
      extend: {
        animation: {
          'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        },
        keyframes: {
          pulseGlow: {
            '0%, 100%': {
              boxShadow: '0 0 20px 6px rgba(168, 85, 247, 0.5)',
            },
            '50%': {
              boxShadow: '0 0 30px 10px rgba(232, 121, 249, 0.9)',
            },
          },
        },
      },
    },
    plugins: [],
  }
  