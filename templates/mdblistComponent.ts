/**
 * MDBList API related components for the configuration page
 */

/**
 * Creates the HTML for the MDBList API configuration form
 */
export function getMDBListApiConfigHTML(userId: string, apiKey: string): string {
  return `
  <section>
    <div class="rounded-lg border bg-card p-6 shadow-sm mt-8">
      <h2 class="text-xl font-semibold mb-4">MDBList API Configuration</h2>
      <form method="POST" action="/configure/${userId}/mdblist/config">
        <div class="grid gap-4">
          <div class="grid gap-2">
            <label for="apiKey" class="text-sm font-medium">MDBList API Key</label>
            <input
              type="text"
              id="apiKey"
              name="apiKey"
              value="${apiKey}"
              placeholder="Enter your MDBList API key..."
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p class="text-sm text-muted-foreground">
              Get your free API key from <a href="https://mdblist.com/preferences/" target="_blank" class="text-primary hover:underline">MDBList Preferences</a>.
            </p>
          </div>
          <button
            type="submit"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Save API Configuration
          </button>
        </div>
      </form>
    </div>
  </section>
  `;
}
