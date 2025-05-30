/**
 * Templates for MDBList catalog integration
 */
import { MDBListCatalog } from '../packages/core/utils/mdblist';

/**
 * Creates HTML for the MDBList search form
 */
export function getMDBListSearchFormHTML(userId: string): string {
  // We don't know the API key here, so we'll just provide a basic form
  // The server will handle the check if the key is valid or not
  return `
    <div class="rounded-lg border bg-card p-6 shadow-sm mt-8">
      <h2 class="text-xl font-semibold mb-4">Search MDBList Catalogs</h2>
      <form method="GET" action="/configure/${userId}/mdblist/search" class="grid gap-4">
        <div class="grid gap-2">
          <label for="searchQuery" class="text-sm font-medium">Search Query</label>
          <div class="flex">
            <input
              type="text"
              id="searchQuery"
              name="query"
              placeholder="Enter search query..."
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-grow"
              required
            />
            <button
              type="submit"
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ml-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Search
            </button>
          </div>
        </div>
      </form>
      <div class="mt-4">
        <a 
          href="/configure/${userId}/mdblist/top100" 
          class="text-primary hover:text-primary/80 text-sm flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
            <path d="M12 2v20M2 12h20"></path>
          </svg>
          View Top 100 Lists
        </a>
      </div>
    </div>
  `;
}

/**
 * Creates HTML for a single MDBList catalog item
 */
export function getMDBListCatalogItemHTML(catalog: MDBListCatalog, userId: string): string {
  return `
    <div class="catalog-item flex flex-col sm:flex-row items-start gap-3 mb-4">
      <div class="flex flex-col w-full p-4 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors">
        <div class="flex flex-col gap-3">
          <div class="flex-grow overflow-hidden min-w-0">
            <h3 class="font-medium text-base sm:text-lg break-words">${catalog.name} (${catalog.type})</h3>
            <div class="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
              <span class="truncate">By ${catalog.user.name}</span>
              <span class="hidden sm:inline">•</span>
              <span>${catalog.itemCount} items</span>
              <span class="hidden sm:inline">•</span>
              <span class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                  <path d="M7 10v12"></path>
                  <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>
                </svg>
                ${catalog.likes}
              </span>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 mt-2">
            <a href="${catalog.mdblistUrl}" target="_blank" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs sm:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 sm:h-9 px-3 py-2 flex-grow sm:flex-grow-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              View on MDBList
            </a>
            <form method="POST" action="/configure/${userId}/mdblist/add" class="flex-grow sm:flex-grow-0">
              <input type="hidden" name="userId" value="${catalog.user.id}">
              <input type="hidden" name="listId" value="${catalog.id.split('-')[1]}">
              <input type="hidden" name="name" value="${catalog.name}">
              <input type="hidden" name="type" value="${catalog.type}">
              <input type="hidden" name="mdblistId" value="${catalog.mdblistId || ''}">
              <input type="hidden" name="slug" value="${catalog.slug || ''}">
              <button type="submit" class="w-full sm:w-auto inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs sm:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 sm:h-9 px-3 py-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                  <path d="M12 2v20M2 12h20"></path>
                </svg>
                Add to AIOCatalogs
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Creates HTML for MDBList search results
 */
export function getMDBListSearchResultsHTML(
  userId: string,
  query: string,
  catalogs: MDBListCatalog[],
  message: string = '',
  error: string = ''
): string {
  const catalogItems = catalogs.map(catalog => getMDBListCatalogItemHTML(catalog, userId)).join('');

  return `
    <!DOCTYPE html>
    <html lang="en" class="dark">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>AIOCatalogs - MDBList Search Results</title>
        <link rel="icon" href="https://i.imgur.com/fRPYeIV.png" />
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              container: {
                center: true,
                padding: {
                  DEFAULT: '1rem',
                  sm: '2rem',
                },
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
                  card: {
                    DEFAULT: 'hsl(240 10% 5.9%)',
                    foreground: 'hsl(0 0% 98%)',
                  },
                },
                spacing: {
                  'safe-top': 'env(safe-area-inset-top)',
                  'safe-bottom': 'env(safe-area-inset-bottom)',
                  'safe-left': 'env(safe-area-inset-left)',
                  'safe-right': 'env(safe-area-inset-right)',
                },
              },
            },
          };
        </script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

          * {
            font-family: 'Inter', sans-serif;
            -webkit-tap-highlight-color: transparent;
          }

          .bg-card-pattern {
            background-color: hsla(240, 10%, 5.9%, 1);
            background-image:
              radial-gradient(at 67% 27%, hsla(215, 98%, 61%, 0.05) 0px, transparent 50%),
              radial-gradient(at 0% 0%, hsla(343, 100%, 76%, 0.05) 0px, transparent 50%);
          }

          @supports(padding: max(0px)) {
            .container {
              padding-left: max(env(safe-area-inset-left), 1rem);
              padding-right: max(env(safe-area-inset-right), 1rem);
            }
          }
        </style>
      </head>
      <body class="min-h-screen bg-background text-foreground bg-card-pattern">
        <div class="container py-6 sm:py-10">
          <header class="mb-6 sm:mb-8">
            <div class="flex flex-col">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
                <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">MDBList Search Results</h1>
                <a href="/configure/${userId}" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs sm:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 sm:h-10 px-3 sm:px-4 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                  Back to Configuration
                </a>
              </div>
              <p class="text-base sm:text-lg text-muted-foreground">
                Results for: <span class="font-medium text-primary">${query}</span>
              </p>
            </div>
          </header>

          ${message ? `<div class="p-4 mb-6 bg-primary/10 border border-primary/50 rounded-lg text-sm sm:text-base">${message}</div>` : ''}
          ${error ? `<div class="p-4 mb-6 bg-destructive/10 border border-destructive/50 rounded-lg text-sm sm:text-base">${error}</div>` : ''}

          <div class="grid gap-6 sm:gap-8">
            <section>
              <div class="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
                <h2 class="text-lg sm:text-xl font-semibold mb-4">Search MDBList Catalogs</h2>
                <form method="GET" action="/configure/${userId}/mdblist/search" class="grid gap-4">
                  <div class="grid gap-2">
                    <label for="searchQuery" class="text-sm font-medium">Search Query</label>
                    <div class="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        id="searchQuery"
                        name="query"
                        value="${query}"
                        placeholder="Enter search query..."
                        class="flex h-8 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      />
                      <button
                        type="submit"
                        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs sm:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 sm:h-10 px-3 sm:px-4 py-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        Search
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </section>

            <section>
              <h2 class="text-lg sm:text-xl font-semibold mb-4">Search Results</h2>
              ${catalogs.length > 0 ? catalogItems : '<p class="text-muted-foreground text-sm sm:text-base">No results found. Try a different search query.</p>'}
            </section>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Creates HTML for MDBList top 100 page
 */
export function getMDBListTop100HTML(
  userId: string,
  catalogs: MDBListCatalog[],
  message: string = '',
  error: string = ''
): string {
  const catalogItems = catalogs.map(catalog => getMDBListCatalogItemHTML(catalog, userId)).join('');

  return `
    <!DOCTYPE html>
    <html lang="en" class="dark">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>AIOCatalogs - MDBList Top 100</title>
        <link rel="icon" href="https://i.imgur.com/fRPYeIV.png" />
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              container: {
                center: true,
                padding: {
                  DEFAULT: '1rem',
                  sm: '2rem',
                },
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
                  card: {
                    DEFAULT: 'hsl(240 10% 5.9%)',
                    foreground: 'hsl(0 0% 98%)',
                  },
                },
                spacing: {
                  'safe-top': 'env(safe-area-inset-top)',
                  'safe-bottom': 'env(safe-area-inset-bottom)',
                  'safe-left': 'env(safe-area-inset-left)',
                  'safe-right': 'env(safe-area-inset-right)',
                },
              },
            },
          };
        </script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

          * {
            font-family: 'Inter', sans-serif;
            -webkit-tap-highlight-color: transparent;
          }

          .bg-card-pattern {
            background-color: hsla(240, 10%, 5.9%, 1);
            background-image:
              radial-gradient(at 67% 27%, hsla(215, 98%, 61%, 0.05) 0px, transparent 50%),
              radial-gradient(at 0% 0%, hsla(343, 100%, 76%, 0.05) 0px, transparent 50%);
          }

          @supports(padding: max(0px)) {
            .container {
              padding-left: max(env(safe-area-inset-left), 1rem);
              padding-right: max(env(safe-area-inset-right), 1rem);
            }
          }
        </style>
      </head>
      <body class="min-h-screen bg-background text-foreground bg-card-pattern">
        <div class="container py-6 sm:py-10">
          <header class="mb-6 sm:mb-8">
            <div class="flex flex-col">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
                <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">MDBList Top 100 Lists</h1>
                <a href="/configure/${userId}" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs sm:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 sm:h-10 px-3 sm:px-4 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                  Back to Configuration
                </a>
              </div>
              <p class="text-base sm:text-lg text-muted-foreground">
                Browse and add popular catalogs from MDBList
              </p>
            </div>
          </header>

          ${message ? `<div class="p-4 mb-6 bg-primary/10 border border-primary/50 rounded-lg text-sm sm:text-base">${message}</div>` : ''}
          ${error ? `<div class="p-4 mb-6 bg-destructive/10 border border-destructive/50 rounded-lg text-sm sm:text-base">${error}</div>` : ''}

          <div class="grid gap-6 sm:gap-8">
            <section>
              <div class="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
                <h2 class="text-lg sm:text-xl font-semibold mb-4">Search MDBList Catalogs</h2>
                <form method="GET" action="/configure/${userId}/mdblist/search" class="grid gap-4">
                  <div class="grid gap-2">
                    <label for="searchQuery" class="text-sm font-medium">Search Query</label>
                    <div class="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        id="searchQuery"
                        name="query"
                        placeholder="Enter search query..."
                        class="flex h-8 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      />
                      <button
                        type="submit"
                        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs sm:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 sm:h-10 px-3 sm:px-4 py-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        Search
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </section>

            <section>
              <h2 class="text-lg sm:text-xl font-semibold mb-4">Top 100 Lists</h2>
              ${catalogs.length > 0 ? catalogItems : '<p class="text-muted-foreground text-sm sm:text-base">Failed to load top lists. Please try again later.</p>'}
            </section>
          </div>
        </div>
      </body>
    </html>
  `;
}
