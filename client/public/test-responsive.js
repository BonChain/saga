/**
 * Responsive Design Test Utility
 * Provides real-time breakpoint and screen size information for testing
 */

/**
 * Updates screen size and breakpoint indicators
 */
function updateScreenSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const screenSizeElement = document.getElementById('screenSize');
    const breakpointElement = document.getElementById('breakpoint');

    if (!screenSizeElement || !breakpointElement) {
        console.error('Required elements not found');
        return;
    }

    screenSizeElement.textContent = `${width}x${height}`;

    if (width <= 480) {
        breakpointElement.textContent = 'Mobile (≤480px)';
    } else if (width <= 768) {
        breakpointElement.textContent = 'Tablet (481-768px)';
    } else if (width <= 1024) {
        breakpointElement.textContent = 'Small Desktop (769-1024px)';
    } else {
        breakpointElement.textContent = 'Large Desktop (≥1025px)';
    }
}

/**
 * Initialize responsive testing utilities
 */
function initResponsiveTest() {
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    console.log('Responsive test utilities initialized');
}

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResponsiveTest);
} else {
    initResponsiveTest();
}