/**
 * Header components for the configuration page
 */

/**
 * Creates the HTML for the page header including title, user info, etc.
 */
export function getConfigPageHeaderHTML(userId: string): string {
  return `
  <header class="py-4 md:py-4 mb-4">
    <div class="flex flex-col space-y-6">
      <div class="flex flex-col md:flex-row items-center md:justify-between gap-4">
        <div>
          <h1 class="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            AIOCatalogs
          </h1>
          <p class="mt-1 text-xl text-muted-foreground">
            Configuration Panel
          </p>
        </div>
        <div class="flex items-center gap-3">
          <a
            href="/configure?noRedirect=true"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-subtle h-9 px-4 py-2"
          >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
            User Selection
          </a>
        </div>
      </div>
      
      <div class="p-4 md:p-6 bg-card rounded-lg border border-border shadow-card">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="text-md font-medium">
            User ID
            </span>
            <span class="font-mono text-sm sm:text-base bg-muted/50 rounded px-3 py-2 border border-border/50 max-w-full truncate">${userId}</span>
          </div>
          <button 
            id="clearStoredUserBtn" 
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-4 py-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
            Clear Stored Configuration
          </button>
        </div>
        <div class="mt-4 text-sm text-muted-foreground bg-destructive/10 rounded px-3 py-2 border border-destructive">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <strong class="text-foreground">WARNING:</strong> Never share your User ID with anyone. It grants full access to view, edit, and delete all your catalogs and API keys.
            </div>
        </div>
      </div>
    </div>
    <div id="notifications"></div>
  </header>
  `;
}
