document.addEventListener('DOMContentLoaded', () => {
    const pills = document.querySelectorAll('.condiment-pill');
    
    pills.forEach(pill => {
        const checkbox = pill.querySelector('.condiment-checkbox');
        
        // Only play the splash animation when the pill becomes active (selected).
        pill.addEventListener('click', () => {
            // allow other click handlers (which toggle .active) to run first
            setTimeout(() => {
                const isActive = pill.classList.contains('active');
                if (!isActive) {
                    // if now inactive, don't play animation
                    return;
                }

                // Restart animation by clearing then forcing reflow
                checkbox.style.animation = '';
                void checkbox.offsetWidth;

                // Play animation and apply goo filter
                checkbox.style.animation = 'splash-checkbox 0.6s ease-out';
                checkbox.style.filter = 'url(#goo)';

                // Clean up after animation completes
                setTimeout(() => {
                    checkbox.style.animation = '';
                    checkbox.style.filter = '';
                }, 600);
            }, 0);
        });
    });
});