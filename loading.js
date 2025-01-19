class LoadingScreen {
  constructor() {
    this.loadingScreen = document.createElement('div');
    this.loadingScreen.className = 'loading-screen';
    
    this.asciiCat = document.createElement('pre');
    this.asciiCat.className = 'ascii-cat gradient-text';
    
    // ASCII cat art with special spans for eyes
    this.asciiCat.innerHTML = `
      /\\___/\\
(  <span class="eye left-eye">o</span> <span class="eye right-eye">o</span>  )
(  =^=  )
(     )
|___|\n
    Loading...
    `.trim();
    
    this.loadingScreen.appendChild(this.asciiCat);
    document.body.appendChild(this.loadingScreen);

    // Start the blinking animation immediately
    this.blinkInterval = null;
    this.startBlinking();
  }

  startBlinking() {
    // Initial blink
    this.blink();
    
    // Set up interval for regular blinking
    this.blinkInterval = setInterval(() => this.blink(), 3000);
  }

  blink() {
    const eyes = this.loadingScreen.querySelectorAll('.eye');
    eyes.forEach(eye => {
      // Store original content
      const original = eye.textContent;
      // Change to blink
      eye.textContent = '-';
      // Set back to original after short delay
      setTimeout(() => {
        if (this.loadingScreen.parentNode) { // Check if element still exists
          eye.textContent = original;
        }
      }, 100);
    });
  }

  hide() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        // Clear the blink interval
        if (this.blinkInterval) {
          clearInterval(this.blinkInterval);
        }
        this.loadingScreen.classList.add('fade-out');
        setTimeout(() => {
          if (this.loadingScreen.parentNode) {
            this.loadingScreen.remove();
          }
        }, 500);
      }, 1000);
    });
  }
}

// Initialize and start the loading screen when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = new LoadingScreen();
  loadingScreen.hide();
});