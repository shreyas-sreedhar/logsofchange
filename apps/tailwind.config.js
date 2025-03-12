module.exports = {
    theme: {
        extend: {
            animation: {
                'glow-sequential': 'glowDot 2s ease-in-out infinite',
                'shine-slow': 'shine 6s ease-in-out infinite',
                'shine-vertical': 'shineVertical 6s ease-in-out infinite',
                'ripple': 'ripple 1.5s ease-out forwards',
                'subtle-bounce': 'subtleBounce 2s ease-in-out infinite',
                'pulse-slow': 'pulseSlow 4s ease-in-out infinite',
                'rotate-cw': 'rotateCW 10s linear infinite',
                'rotate-ccw': 'rotateCCW 10s linear infinite',
                'sparkle-fade': 'sparkleFade 2s ease-out forwards',
            },
            keyframes: {
                glowDot: {
                    '0%, 100%': {
                        backgroundColor: 'rgb(0 0 0 / 0.7)', // black with opacity
                        transform: 'scale(1)'
                    },
                    '50%': {
                        backgroundColor: 'rgb(229 229 229)', // gray-200/off-white
                        transform: 'scale(1.1)'
                    }
                },
                shine: {
                    '0%': { left: '-100%' },
                    '50%, 100%': { left: '100%' }
                },
                shineVertical: {
                    '0%': { top: '-100%' },
                    '50%, 100%': { top: '100%' }
                },
                ripple: {
                    '0%': { transform: 'scale(0)', opacity: '0.5' },
                    '100%': { transform: 'scale(1)', opacity: '0' }
                },
                subtleBounce: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-2px)' }
                },
                pulseSlow: {
                    '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
                    '50%': { opacity: '1', transform: 'scale(1.05)' }
                },
                rotateCW: {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                },
                rotateCCW: {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(-360deg)' }
                },
                sparkleFade: {
                    '0%': { opacity: '0', transform: 'scale(0)' },
                    '50%': { opacity: '1', transform: 'scale(1)' },
                    '100%': { opacity: '0', transform: 'scale(0)' }
                }
            },
            animationDelay: {
                '300': '300ms',
                '500': '500ms',
                '800': '800ms',
                '1000': '1000ms',
            },
            perspective: {
                '1200': '1200px',
            },
        },
    },
    plugins: [
        function ({ addUtilities, theme }) {
            const newUtilities = {};

            Object.entries(theme('animationDelay', {})).forEach(([key, value]) => {
                newUtilities[`.animation-delay-${key}`] = {
                    'animation-delay': value,
                };
            });

            addUtilities(newUtilities);
        },
    ],
}