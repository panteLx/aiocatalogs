/**
 * Add catalog form component for the configuration page
 */

/**
 * Creates the HTML for the add catalog form
 */
export function getAddCatalogFormHTML(userId: string): string {
  return `
  <section>
    <div class="rounded-lg border bg-card p-6 shadow-card">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h2 class="text-xl font-semibold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary mr-2">
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
            <line x1="12" x2="12" y1="10" y2="16"></line>
            <line x1="9" x2="15" y1="13" y2="13"></line>
          </svg>
          Add New Catalog
        </h2>
      </div>
      <form method="POST" action="/configure/${userId}/add" class="animate-enter">
        <div class="grid gap-4">
          <div class="grid gap-2">
            <label for="catalogUrl" class="text-sm font-medium flex items-center">
              <span>Catalog Manifest URL</span>
              <span class="ml-1 text-destructive">*</span>
            </label>
            <div class="relative">
              <input
                type="url"
                id="catalogUrl"
                name="catalogUrl"
                placeholder="https://example.com/manifest.json"
                required
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" x2="12" y1="8" y2="12"></line>
                  <line x1="12" x2="12.01" y1="16" y2="16"></line>
                </svg>
              </div>
            </div>
            <p class="text-sm text-muted-foreground">
              Enter the manifest.json URL of the catalog addon you want to add
            </p>
          </div>
          <div class="flex justify-end">
            <button
              type="submit"
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-subtle"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              Add Catalog
            </button>
          </div>
        </div>
      </form>
    </div>
  </section>
  `;
}
