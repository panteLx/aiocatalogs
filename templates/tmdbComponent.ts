/**
 * TMDB API related components for the configuration page
 */

/**
 * Creates the HTML for the TMDB API configuration form
 */
export function getTMDBConfigHTML(userId: string, apiKey: string): string {
  return `
  <section>
    <div class="rounded-lg border bg-card p-6 shadow-card">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 class="text-xl font-semibold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary mr-2">
            <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
          </svg>
          TMDB Configuration
        </h2>
      </div>
      <form method="POST" action="/configure/${userId}/tmdb/save">
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
                  Required for TMDB movie and TV series lists. Your API key will be stored securely and used only for retrieving content.
                </span>
              </span>
            </label>
            <div class="relative">
              <input
                type="text"
                id="apiKey"
                name="apiKey"
                value="${apiKey}"
                class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your TMDB API Key"
                autocomplete="off"
              />
            </div>
          </div>

          <div class="flex justify-end">
            <button
              type="submit"
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            >
              ${apiKey ? 'Update Configuration' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </form>

      ${
        apiKey
          ? `
      <div class="mt-6">
        <h3 class="text-sm font-medium mb-3">Available TMDB Catalogs</h3>
        <div class="grid gap-3">
          <form method="POST" action="/configure/${userId}/add" class="flex items-center justify-between p-3 border rounded-lg">
            <span class="text-sm">Popular Movies</span>
            <input type="hidden" name="catalogUrl" value="/catalog/${userId}/tmdb/popular-movies/catalog.json" />
            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3">
              Add to Your Catalogs
            </button>
          </form>

          <form method="POST" action="/configure/${userId}/add" class="flex items-center justify-between p-3 border rounded-lg">
            <span class="text-sm">Top Rated Movies</span>
            <input type="hidden" name="catalogUrl" value="/catalog/${userId}/tmdb/top-rated-movies/catalog.json" />
            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3">
              Add to Your Catalogs
            </button>
          </form>

          <form method="POST" action="/configure/${userId}/add" class="flex items-center justify-between p-3 border rounded-lg">
            <span class="text-sm">Popular TV Series</span>
            <input type="hidden" name="catalogUrl" value="/catalog/${userId}/tmdb/popular-series/catalog.json" />
            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3">
              Add to Your Catalogs
            </button>
          </form>

          <form method="POST" action="/configure/${userId}/add" class="flex items-center justify-between p-3 border rounded-lg">
            <span class="text-sm">Top Rated TV Series</span>
            <input type="hidden" name="catalogUrl" value="/catalog/${userId}/tmdb/top-rated-series/catalog.json" />
            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3">
              Add to Your Catalogs
            </button>
          </form>
        </div>
      </div>
      `
          : ''
      }
    </div>
  </section>
  `;
}
