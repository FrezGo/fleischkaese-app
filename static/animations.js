document.addEventListener('DOMContentLoaded', () => {
    const pills = document.querySelectorAll('.condiment-pill');
    
    pills.forEach(pill => {
        const checkbox = pill.querySelector('.condiment-checkbox');
        
        pill.addEventListener('click', () => {
            // Remove existing animation classes
            checkbox.style.animation = '';
            
            // Force a reflow to restart the animation
            void checkbox.offsetWidth;
            
            // Add the animation
            checkbox.style.animation = 'splash-checkbox 0.6s ease-out';
            checkbox.style.filter = 'url(#goo)';
            
            // Remove the animation and filter after it completes
            setTimeout(() => {
                checkbox.style.animation = '';
                checkbox.style.filter = '';
            }, 600);
        });
    });
});