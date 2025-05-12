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
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    stremioUrl
  )}`;

  return `
  <section class="mt-6">
    <div class="rounded-lg border bg-card p-6 shadow-sm">
      <h2 class="text-xl font-semibold mb-4">Install Your Addon</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <p class="mb-4">
            Click the button below to install this addon with your catalogs in Stremio:
          </p>
          <a
            href="${stremioUrl}"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Add to Stremio
          </a>

          <div class="mt-6">
            <p class="mb-2">Alternatively, add this URL manually:</p>
            <div class="p-3 rounded-md bg-muted font-mono text-sm break-all">
              ${manifestUrl}
            </div>
            <button
              class="mt-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              type="button"
              onclick="navigator.clipboard.writeText('${manifestUrl}')"
            >
              Copy URL
            </button>
          </div>
        </div>

        <div class="flex flex-col items-center">
          <p class="mb-4">Or scan this QR code with your mobile device:</p>
          <div class="p-4 bg-white rounded-lg inline-block">
            <img
              src="${qrCodeUrl}"
              alt="QR Code for Stremio Addon"
              class="h-[150px] w-[150px]"
            />
          </div>
          <p class="text-sm text-muted-foreground mt-4 text-center">
            The QR code contains the Stremio URL for this addon. Scan it with your
            smartphone to install the addon in the mobile Stremio app.
          </p>
        </div>
      </div>

      <div class="mt-4 p-4 rounded-lg bg-secondary/50 border-l-4 border-primary">
        <p class="text-sm text-muted-foreground">
          <strong>Note:</strong> You have to reinstall the addon after adding or removing
          catalogs.
        </p>
      </div>
    </div>
  </section>
  `;
}
