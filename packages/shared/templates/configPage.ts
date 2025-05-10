/**
 * Shared templates for the configuration page
 *
 * This file contains HTML templates that can be used by both the Node.js and Cloudflare implementations.
 */

/**
 * Creates the HTML for the configuration page
 */
export function getConfigPageHTML(
  userId: string,
  catalogs: any[],
  baseUrl: string,
  message: string = '',
  error: string = '',
  isCloudflare: boolean = false,
  packageVersion: string = '1.0.0'
) {
  const catalogRows = catalogs
    .map((catalog, index, array) => {
      const isFirst = index === 0;
      const isLast = index === array.length - 1;
      const isOnly = array.length === 1;

      return `
    <div class="flex flex-col space-y-2 p-4 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors">
      <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
        <div class="flex-grow overflow-hidden">
          <span class="inline-flex items-center justify-center rounded-full bg-primary h-6 w-6 text-xs font-medium mr-2">${index + 1}</span>
          <h3 class="font-medium break-words d-inline">${catalog.name}</h3>
          <p class="text-sm text-muted-foreground break-words">${catalog.id}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2 shrink-0">
          ${
            !isFirst && !isOnly
              ? `
          <form method="POST" action="/configure/${userId}/moveUp" class="flex-shrink-0">
            <input type="hidden" name="catalogId" value="${catalog.id}">
            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 w-9 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg>
              <span class="sr-only">Move Up</span>
            </button>
          </form>
          `
              : ''
          }
          ${
            !isLast && !isOnly
              ? `
          <form method="POST" action="/configure/${userId}/moveDown" class="flex-shrink-0">
            <input type="hidden" name="catalogId" value="${catalog.id}">
            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 w-9 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
              <span class="sr-only">Move Down</span>
            </button>
          </form>
          `
              : ''
          }
          <form method="POST" action="/configure/${userId}/remove" class="flex-shrink-0">
            <input type="hidden" name="catalogId" value="${catalog.id}">
            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-4 py-2">
              Remove
            </button>
          </form>
        </div>
      </div>
      <p class="text-sm text-muted-foreground break-words overflow-hidden">${catalog.description}</p>
      <p class="text-xs font-mono text-muted-foreground overflow-hidden text-ellipsis">${catalog.endpoint}</p>
    </div>
  `;
    })
    .join('');

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
    <!DOCTYPE html>
    <html lang="en" class="dark">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>AIOCatalogs - Configuration</title>
        <link rel="icon" href="https://i.imgur.com/fRPYeIV.png" />
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
        <script src="https://cdn.tailwindcss.com"></script>
        <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              container: {
                center: true,
                padding: '2rem',
                screens: {
                  '2xl': '1400px',
                },
              },
              extend: {
                colors: {
                  border: 'hsl(240 3.7% 15.9%)',
                  input: 'hsl(240 3.7% 15.9%)',
                  ring: 'hsl(142.1 70.6% 45.3%)',
                  background: 'hsl(240 10% 3.9%)',
                  foreground: 'hsl(0 0% 98%)',
                  primary: {
                    DEFAULT: 'hsl(142.1 70.6% 45.3%)',
                    foreground: 'hsl(144.9 80.4% 10%)',
                  },
                  secondary: {
                    DEFAULT: 'hsl(240 3.7% 15.9%)',
                    foreground: 'hsl(0 0% 98%)',
                  },
                  destructive: {
                    DEFAULT: 'hsl(0 62.8% 30.6%)',
                    foreground: 'hsl(0 0% 98%)',
                  },
                  muted: {
                    DEFAULT: 'hsl(240 3.7% 15.9%)',
                    foreground: 'hsl(240 5% 64.9%)',
                  },
                  accent: {
                    DEFAULT: 'hsl(240 3.7% 15.9%)',
                    foreground: 'hsl(0 0% 98%)',
                  },
                  card: {
                    DEFAULT: 'hsl(240 10% 5.9%)',
                    foreground: 'hsl(0 0% 98%)',
                  },
                },
                borderRadius: {
                  lg: '0.5rem',
                  md: 'calc(0.5rem - 2px)',
                  sm: 'calc(0.5rem - 4px)',
                },
              },
            },
          };
        </script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

          * {
            font-family: 'Inter', sans-serif;
          }

          .bg-card-pattern {
            background-color: hsla(240, 10%, 5.9%, 1);
            background-image:
              radial-gradient(at 67% 27%, hsla(215, 98%, 61%, 0.05) 0px, transparent 50%),
              radial-gradient(at 0% 0%, hsla(343, 100%, 76%, 0.05) 0px, transparent 50%);
          }
        </style>
      </head>
      <body class="min-h-screen bg-background text-foreground bg-card-pattern">
        <div class="container py-10">
          <header class="mb-10">
            <div class="flex flex-col">
              <div class="flex items-center justify-between mb-2">
                <h1 class="text-3xl font-bold tracking-tight">AIO Catalogs - Configuration</h1>
                <div class="hidden md:flex items-center space-x-3">
                  <a
                    href="/configure"
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
                Your unique user ID: <span class="font-medium text-primary">${userId}</span> (save this ID to access your catalogs later)
              </p>
            </div>
          </header>

          <!-- Back to User Selection button, mobile friendly -->
          <div class="md:hidden mb-6">
            <a
              href="/configure"
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                <path d="m15 18-6-6 6-6"></path>
              </svg>
              Back to User Selection
            </a>
          </div>

          <div id="notifications"></div>

          <!-- Sponsor-Button -->
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

          <div class="grid gap-8">
            <section>
              <div class="rounded-lg border bg-card p-6 shadow-sm">
                <h2 class="text-xl font-semibold mb-4">Add New Catalog</h2>
                <form method="POST" action="/configure/${userId}/add">
                  <div class="grid gap-4">
                    <div class="grid gap-2">
                      <label for="catalogUrl" class="text-sm font-medium"
                        >Catalog Manifest URL</label
                      >
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

            <section>
              <h2 class="text-xl font-semibold mb-4">Your Catalogs</h2>
              ${
                catalogs.length === 0
                  ? '<div class="p-4 rounded-lg bg-secondary/50 text-muted-foreground">No catalogs added yet. Add some catalogs to get started.</div>'
                  : `<div class="grid grid-cols-1 gap-4">${catalogRows}</div>`
              }
            </section>

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
          </div>
        </div>

        <!-- Footer with Social Links -->
        <footer class="py-6 border-t border-border mt-10">
          <div class="container flex flex-col items-center gap-4">
            <div class="flex space-x-4">
              <!-- GitHub -->
              <a href="https://github.com/panteLx/aiocatalogs" target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                  <path d="M9 18c-4.51 2-5-2-7-2"></path>
                </svg>
              </a>
              
              <!-- Discord -->
              <a href="https://discord.gg/Ma4SnagqwE" target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </a>
              
              <!-- Sponsor-Link -->
              <a href="https://buymeacoffee.com/pantel" target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                  <path d="M6 1v3"></path>
                  <path d="M10 1v3"></path>
                  <path d="M14 1v3"></path>
                </svg>
              </a>
            </div>
            <div class="text-sm text-muted-foreground text-center">
              <p>Version: v${packageVersion} - Developed by panteLx</p>
              <p class="mt-1">&copy; ${new Date().getFullYear()} AIOCatalogs - <a href="https://github.com/panteLx/aiocatalogs/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" class="underline hover:text-primary">MIT License</a></p>
            </div>
          </div>
        </footer>

        <script>
          function copyToClipboard(text) {
            navigator.clipboard.writeText(text);
            showToast('Copied to clipboard!', 'success');
          }

          // Toast notification function
          function showToast(message, type) {
            const bgColor = type === 'success' ? 'linear-gradient(to right, #0cce6b, #0caa57)' : 
                           type === 'error' ? 'linear-gradient(to right, #e53935, #c62828)' : 
                           'linear-gradient(to right, #2196f3, #1976d2)';
            
            Toastify({
              text: message,
              duration: 3000,
              gravity: "top",
              position: "right",
              style: {
                background: bgColor,
                borderRadius: "8px",
              },
              stopOnFocus: true,
            }).showToast();
          }

          // Show toasts if there are messages or errors
          document.addEventListener('DOMContentLoaded', function() {
            ${message ? `showToast("${message}", "success");` : ''}
            ${error ? `showToast("${error}", "error");` : ''}
          });
        </script>
      </body>
    </html>
  `;
}

/**
 * Creates the HTML for the home page
 */
export function getHomePageHTML(
  message: string = '',
  error: string = '',
  packageVersion: string = '1.0.0'
) {
  return `
    <!DOCTYPE html>
    <html lang="en" class="dark">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>AIO Catalogs</title>
        <link rel="icon" href="https://i.imgur.com/fRPYeIV.png" />
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
        <script src="https://cdn.tailwindcss.com"></script>
        <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              container: {
                center: true,
                padding: '2rem',
                screens: {
                  '2xl': '1400px',
                },
              },
              extend: {
                colors: {
                  border: 'hsl(240 3.7% 15.9%)',
                  input: 'hsl(240 3.7% 15.9%)',
                  ring: 'hsl(142.1 70.6% 45.3%)',
                  background: 'hsl(240 10% 3.9%)',
                  foreground: 'hsl(0 0% 98%)',
                  primary: {
                    DEFAULT: 'hsl(142.1 70.6% 45.3%)',
                    foreground: 'hsl(144.9 80.4% 10%)',
                  },
                  secondary: {
                    DEFAULT: 'hsl(240 3.7% 15.9%)',
                    foreground: 'hsl(0 0% 98%)',
                  },
                  destructive: {
                    DEFAULT: 'hsl(0 62.8% 30.6%)',
                    foreground: 'hsl(0 0% 98%)',
                  },
                  muted: {
                    DEFAULT: 'hsl(240 3.7% 15.9%)',
                    foreground: 'hsl(240 5% 64.9%)',
                  },
                  accent: {
                    DEFAULT: 'hsl(240 3.7% 15.9%)',
                    foreground: 'hsl(0 0% 98%)',
                  },
                  card: {
                    DEFAULT: 'hsl(240 10% 5.9%)',
                    foreground: 'hsl(0 0% 98%)',
                  },
                },
                borderRadius: {
                  lg: '0.5rem',
                  md: 'calc(0.5rem - 2px)',
                  sm: 'calc(0.5rem - 4px)',
                },
              },
            },
          };
        </script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

          * {
            font-family: 'Inter', sans-serif;
          }

          .bg-card-pattern {
            background-color: hsla(240, 10%, 5.9%, 1);
            background-image:
              radial-gradient(at 67% 27%, hsla(215, 98%, 61%, 0.05) 0px, transparent 50%),
              radial-gradient(at 0% 0%, hsla(343, 100%, 76%, 0.05) 0px, transparent 50%);
          }
        </style>
      </head>
      <body class="min-h-screen bg-background text-foreground bg-card-pattern">
        <div class="container py-16">
          <h1 class="text-4xl font-bold tracking-tight text-center mb-4">
            All-in-One Catalogs - User Selection
          </h1>

          <div id="notifications"></div>

          <div class="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto mt-20">
            <div class="rounded-lg border bg-card p-6 shadow-sm">
              <h2 class="text-xl font-semibold mb-4">New User</h2>
              <p class="text-muted-foreground mb-6">
                Create a new configuration for your catalogs.
              </p>
              <form method="POST" action="/configure/create">
                <button
                  type="submit"
                  class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
                >
                  Create New Configuration
                </button>
              </form>
            </div>

            <div class="rounded-lg border bg-card p-6 shadow-sm">
              <h2 class="text-xl font-semibold mb-4">Existing User</h2>
              <p class="text-muted-foreground mb-4">Load your existing catalog configuration.</p>
              <form method="POST" action="/configure/load">
                <div class="grid gap-4">
                  <div class="grid gap-2">
                    <label for="userId" class="text-sm font-medium">Your User ID</label>
                    <input
                      type="text"
                      id="userId"
                      name="userId"
                      required
                      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="submit"
                    class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 w-full"
                  >
                    Load Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Footer with Social Links -->
        <footer class="py-6 border-t border-border mt-10">
          <div class="container flex flex-col items-center gap-4">
            <div class="flex space-x-4">
              <!-- GitHub -->
              <a href="https://github.com/panteLx/aiocatalogs" target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                  <path d="M9 18c-4.51 2-5-2-7-2"></path>
                </svg>
              </a>
              
              <!-- Discord -->
              <a href="https://discord.gg/Ma4SnagqwE" target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </a>
              
              <!-- Sponsor-Link -->
              <a href="https://buymeacoffee.com/pantel" target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                  <path d="M6 1v3"></path>
                  <path d="M10 1v3"></path>
                  <path d="M14 1v3"></path>
                </svg>
              </a>
            </div>
            <div class="text-sm text-muted-foreground text-center">
              <p>Version: v${packageVersion} - Developed by panteLx</p>
              <p class="mt-1">&copy; ${new Date().getFullYear()} AIOCatalogs - <a href="https://github.com/panteLx/aiocatalogs/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" class="underline hover:text-primary">MIT License</a></p>
            </div>
          </div>
        </footer>

        <script>
          // Toast notification function
          function showToast(message, type) {
            const bgColor = type === 'success' ? 'linear-gradient(to right, #0cce6b, #0caa57)' : 
                           type === 'error' ? 'linear-gradient(to right, #e53935, #c62828)' : 
                           'linear-gradient(to right, #2196f3, #1976d2)';
            
            Toastify({
              text: message,
              duration: 3000,
              gravity: "top",
              position: "right",
              style: {
                background: bgColor,
                borderRadius: "8px",
              },
              stopOnFocus: true,
            }).showToast();
          }

          // Show toasts if there are messages or errors
          document.addEventListener('DOMContentLoaded', function() {
            ${message ? `showToast("${message}", "success");` : ''}
            ${error ? `showToast("${error}", "error");` : ''}
          });
        </script>
      </body>
    </html>
  `;
}

/**
 * Helper function to convert stremio:// URLs to https://
 */
export function convertStremioUrl(url: string): string {
  if (url.startsWith('stremio://')) {
    return url.replace('stremio://', 'https://');
  }
  return url;
}
