/**
 * Sponsor banner component for the configuration page
 */

/**
 * Creates the HTML for the sponsor banner section
 */
export function getSponsorBannerHTML(): string {
  return `
  <div class="mb-8 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500 flex flex-col sm:flex-row items-center justify-between">
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
  `;
}
