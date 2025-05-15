/**
 * MDBList API related components for the configuration page
 */

/**
 * Creates the HTML for the MDBList API configuration form
 */
export function getMDBListApiConfigHTML(userId: string, apiKey: string): string {
  return `
  <section>
    <div class="rounded-lg border bg-card p-6 shadow-card">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 class="text-xl font-semibold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary mr-2">
            <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
          </svg>
          MDBList Configuration
        </h2>
      </div>
      <form method="POST" action="/configure/${userId}/mdblist/config" class="animate-enter">
        <div class="grid gap-4">
          <div class="grid gap-2">
            <label for="apiKey" class="text-sm font-medium flex items-center">
              API Key
              <span class="relative ml-1.5 group">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground cursor-help">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <path d="M12 17h.01"></path>
                </svg>
                <span class="hidden group-hover:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-60 p-2 bg-card rounded shadow-lg text-xs text-muted-foreground border border-border">
                  Required for MDBList search and Top 100 lists functionality. Your API key will be stored securely and used only for retrieving posters.
                </span>
              </span>
            </label>
            <div class="relative">
              <input
                type="text"
                id="apiKey"
                name="apiKey"
                value="${apiKey}"
                placeholder="Enter your MDBList API Key"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            </div> 
            <p class="text-sm text-muted-foreground flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
              Get your free API key from 
              <a href="https://mdblist.com/preferences/" target="_blank" class="text-primary hover:underline inline-flex items-center">
                MDBList 
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-1">
                  <path d="M7 7h10v10"></path>
                  <path d="M7 17 17 7"></path>
                </svg>
              </a>
            </p>
          </div>
          <div class="flex justify-end">
            <button
              type="submit"
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-subtle"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              ${apiKey ? 'Update API Key' : 'Save API Key'}
            </button>
          </div>
        </div>
      </form>
    </div>
  </section>
  `;
}
