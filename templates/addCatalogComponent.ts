/**
 * Add catalog form component for the configuration page
 */

/**
 * Creates the HTML for the add catalog form
 */
export function getAddCatalogFormHTML(userId: string): string {
  return `
  <section>
    <div class="rounded-lg border bg-card p-6 shadow-sm">
      <h2 class="text-xl font-semibold mb-4">Add New Catalog</h2>
      <form method="POST" action="/configure/${userId}/add">
        <div class="grid gap-4">
          <div class="grid gap-2">
            <label for="catalogUrl" class="text-sm font-medium">Catalog Manifest URL</label>
            <input
              type="url"
              id="catalogUrl"
              name="catalogUrl"
              placeholder="https://example.com/manifest.json"
              required
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p class="text-sm text-muted-foreground">
              Enter the manifest.json URL of the catalog addon you want to add (e.g.
              MDBList)
            </p>
          </div>
          <button
            type="submit"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full sm:w-auto"
          >
            Add Catalog
          </button>
        </div>
      </form>
    </div>
  </section>
  `;
}
