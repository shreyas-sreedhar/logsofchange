module.exports = {
    theme: {
        extend: {
            animation: {
                'glow-sequential': 'glowDot 2s ease-in-out infinite',
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
                }
            },
        },
    },
}