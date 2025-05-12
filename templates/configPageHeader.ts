/**
 * Header components for the configuration page
 */

/**
 * Creates the HTML for the page header including title, user info, etc.
 */
export function getConfigPageHeaderHTML(userId: string): string {
  return `
  <header class="mb-10">
    <div class="flex flex-col">
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-3xl font-bold tracking-tight">AIOCatalogs - Configuration</h1>
        <div class="hidden md:flex items-center space-x-3">
          <a
            href="/configure?noRedirect=true"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2"
          >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
            Back to User Selection
          </a>
        </div>
      </div>
      <p class="text-lg text-muted-foreground">
        User ID: <span class="font-medium text-primary">${userId}</span>
        <button 
          id="clearStoredUserBtn" 
          class="ml-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-6 px-2 py-1"
        >
          Clear Config from Local Storage
        </button>
      </p>
    </div>
  </header>

  <!-- Back to User Selection button, mobile friendly -->
  <div class="md:hidden mb-6">
    <a
      href="/configure?noRedirect=true"
      class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 w-full"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
        <path d="m15 18-6-6 6-6"></path>
      </svg>
      Back to User Selection
    </a>
  </div>

  <div id="notifications"></div>
  `;
}
