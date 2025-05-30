/**
 * Featured banner component for the configuration page
 */

/**
 * Creates the HTML for the featured banner section with alternating content
 */
export function getFeaturedBannerHTML(): string {
  return `
  <style>
    .banner-container > div {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      opacity: 0;
      transform: translateY(-10px);
      transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
    }
    .banner-container > div.active {
      opacity: 1;
      transform: translateY(0);
      z-index: 2;
    }
  </style>
  <script>
    function initRotatingBanners() {
      const container = document.querySelector('.banner-container');
      if (!container) return;
      
      const banners = Array.from(container.children);
      let currentIndex = 0;
      
      // Initial state
      banners[0].classList.add('active');
      
      function rotateBanners() {
        banners[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % banners.length;
        banners[currentIndex].classList.add('active');
      }
      
      // Rotate every 30 seconds
      setInterval(rotateBanners, 10000);
    }
    
    // Initialize after DOM is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initRotatingBanners);
    } else {
      initRotatingBanners();
    }
  </script>
  <div class="banner-container relative md:min-h-[120px] min-h-[150px] md:mb-0 mb-8">
    <div class="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500 flex flex-col sm:flex-row items-center justify-between">
      <div>
        <h3 class="font-semibold mb-1">Support AIOCatalogs</h3>
        <p class="text-sm text-muted-foreground">Help keep this project maintained and running</p>
      </div>
      <a 
        href="https://buymeacoffee.com/pantel" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="mt-3 sm:mt-0 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-yellow-500 text-black hover:bg-yellow-500/90 h-10 px-4 py-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
          <path d="M5 12l-.854.854A4 4 0 0 0 11 17.236h2a4 4 0 0 0 2.761-1.104l.483-.483"></path>
          <path d="M18 12v.01"></path>
          <path d="M6 13v.01"></path>
          <path d="M5 8v.01"></path>
          <path d="M19 8v.01"></path>
          <path d="M9 17c-2.5-1-4-3.5-4-7a8 8 0 0 1 8-8h.5a8 8 0 0 1 7.5 8.5c0 11-8 8-8 8"></path>
        </svg>
        Donate
      </a>
    </div>
    <div class="p-4 rounded-lg bg-purple-500/10 border border-purple-500 flex flex-col sm:flex-row items-center justify-between">
      <div>
        <h3 class="font-semibold mb-1 text-purple-700 dark:text-purple-300">Try our other addon Easynews++</h3>
        <p class="text-sm text-muted-foreground">Do you use Easynews as a Usenet provider? Check out our Easynews++ addon for an enhanced experience.</p>
      </div>
      <a 
        href="https://en.pantelx.com" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="mt-3 sm:mt-0 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-purple-500 text-white hover:bg-purple-500/90 h-10 px-4 py-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
        </svg>
        Check it out
      </a>
    </div>
        <div class="p-4 rounded-lg bg-blue-500/10 border border-blue-500 flex flex-col sm:flex-row items-center justify-between">
      <div>
        <h3 class="font-semibold mb-1 text-blue-700 dark:text-blue-300">Join our Discord server</h3>
        <p class="text-sm text-muted-foreground">Connect with other users, have fun and get support for AIOCatalogs and other projects.</p>
      </div>
      <a 
        href="https://discord.gg/Ma4SnagqwE" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="mt-3 sm:mt-0 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-500/90 h-10 px-4 py-2"
      >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        Join now
      </a>
    </div>
  </div>
  `;
}
