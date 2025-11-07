document.addEventListener('DOMContentLoaded', () => {
    const pills = document.querySelectorAll('.condiment-pill');
    
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            // Remove existing animation classes
            pill.classList.remove('splash-animation');
            
            // Force a reflow to restart the animation
            void pill.offsetWidth;
            
            // Add the animation class
            pill.classList.add('splash-animation');
        });
    });
});