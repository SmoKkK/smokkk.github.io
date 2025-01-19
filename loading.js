class LoadingScreen {
  constructor() {
    this.loadingScreen = document.createElement('div');
    this.loadingScreen.className = 'loading-screen';
    
    this.asciiCat = document.createElement('pre');
    this.asciiCat.className = 'ascii-cat blink gradient-text';
    
    // ASCII cat art with special spans for eyes
    this.asciiCat.innerHTML = `
      /\\___/\\
(  <span class="eye">o</span> <span class="eye">o</span>  )
(  =^=  )
(     )
|___|\n
    `.trim();
    
    this.loadingScreen.appendChild(this.asciiCat);
    document.body.appendChild(this.loadingScreen);
  }

  hide() {
    // Wait for page content to be ready
    window.addEventListener('load', () => {
      // Add a small delay for better visual effect
      setTimeout(() => {
        this.loadingScreen.classList.add('fade-out');
        // Remove from DOM after transition
        setTimeout(() => {
          this.loadingScreen.remove();
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