/**
 * Addon installation component for the configuration page
 */

/**
 * Creates the HTML for the Stremio addon installation section
 */
export function getAddonInstallationHTML(userId: string, baseUrl: string): string {
  // Create URLs for the Stremio integration with query parameters
  // The baseUrl must already contain the protocol
  const paramsObject = { userId };
  const encodedParams = encodeURIComponent(JSON.stringify(paramsObject));
  const stremioUrl = `stremio://${baseUrl.replace(/^https?:\/\//, '')}/${encodedParams}/manifest.json`;
  const manifestUrl = `${baseUrl}/${encodedParams}/manifest.json`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    stremioUrl
  )}`;

  return `
  <section>
    <div class="rounded-lg border bg-card p-6 shadow-card">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 class="text-xl font-semibold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary mr-2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.29 7 12 12 20.71 7"></polyline>
            <line x1="12" y1="22" x2="12" y2="12"></line>
          </svg>
          Install Your Addon
        </h2>
      </div>

      <div class="grid gap-6 md:gap-8">
        <div class="space-y-4">
          <div class="flex flex-col space-y-2">
            <p class="text-sm text-muted-foreground">
              Click the button below to install this addon with all your catalogs in Stremio:
            </p>
            <div>
              <a
                href="${stremioUrl}"
                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-subtle"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                  <path d="M12 2v8"></path>
                  <path d="m16 4-4 4-4-4"></path>
                  <path d="M20 19c0-5-8-7-8-7s-8 2-8 7"></path>
                  <path d="M4 19h16"></path>
                </svg>
                Add to Stremio
              </a>
            </div>
          </div>

          <div class="p-4 border border-border rounded-md bg-secondary/20">
            <p class="mb-2 text-sm font-medium">Alternatively, add this URL manually:</p>
            <div class="flex">
              <div class="p-3 rounded-l-md bg-muted font-mono text-xs sm:text-sm break-all flex-grow border-y border-l border-border/80">
                ${manifestUrl}
              </div>
              <button
                class="flex-shrink-0 inline-flex items-center justify-center whitespace-nowrap rounded-r-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-secondary hover:bg-accent hover:text-accent-foreground h-auto px-3"
                type="button"
                onclick="navigator.clipboard.writeText('${manifestUrl}'); this.classList.add('bg-primary'); this.classList.add('text-primary-foreground'); setTimeout(() => {this.classList.remove('bg-primary'); this.classList.remove('text-primary-foreground');}, 1000)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                </svg>
                Copy
              </button>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center p-4 border border-border rounded-md bg-secondary/20">
          <p class="mb-3 text-sm font-medium text-center">Scan this QR code with your mobile device:</p>
          <div class="p-3 bg-white rounded-lg inline-block">
            <img
              src="${qrCodeUrl}"
              alt="QR Code for Stremio Addon"
              class="h-[150px] w-[150px]"
              loading="lazy"
            />
          </div>
          <p class="text-xs text-muted-foreground mt-3 text-center max-w-xs">
            The QR code contains the Stremio URL for your addon.
            Scan it with your smartphone to install in the Stremio mobile app.
          </p>
        </div>

        <div class="flex items-start gap-2 p-3 rounded-md bg-accent/10 border border-l-4 border-l-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary mt-0.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <p class="text-sm text-muted-foreground">
            <span class="font-medium text-foreground">Important:</span> You need to reinstall the addon after adding or removing catalogs.
          </p>
        </div>
      </div>
    </div>
  </section>
  `;
}
