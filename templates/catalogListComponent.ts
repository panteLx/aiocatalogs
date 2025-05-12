/**
 * Catalog list components for the configuration page
 */

/**
 * Creates the HTML for the catalog list section
 */
export function getCatalogListHTML(userId: string, catalogs: any[]): string {
  // Generate catalog rows HTML
  const catalogRows = catalogs
    .map((catalog, index, array) => {
      const isFirst = index === 0;
      const isLast = index === array.length - 1;
      const isOnly = array.length === 1;

      return `
    <div class="catalog-item flex items-start gap-2 sm:gap-4" data-draggable="true" data-catalog-id="${catalog.id}" data-catalog-index="${index}">
      <span class="catalog-handle inline-flex items-center justify-center rounded-full bg-primary/10 text-primary h-7 w-7 sm:h-8 sm:w-8 text-sm sm:text-base font-semibold shrink-0 mt-1 md:cursor-grab">
        <span>${index + 1}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hidden mr-1"><path d="M12 5v14M5 12h14"></path></svg>
      </span>
      <div class="flex flex-col space-y-2 p-3 sm:p-4 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors flex-grow min-w-0">
        <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-2 sm:gap-3">
          <div class="flex-grow overflow-hidden min-w-0">
            <h3 class="font-medium break-words d-inline text-base sm:text-lg truncate">${catalog.name}</h3>
            <p class="text-xs sm:text-sm text-muted-foreground break-words truncate">${catalog.id}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            ${
              !isFirst && !isOnly
                ? `
            <form method="POST" action="/configure/${userId}/moveUp" class="flex-shrink-0 md:hidden">
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
            <form method="POST" action="/configure/${userId}/moveDown" class="flex-shrink-0 md:hidden">
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
        <p class="text-xs sm:text-sm text-muted-foreground break-words truncate">${catalog.description}</p>
        <p class="text-xs font-mono text-muted-foreground truncate">${catalog.endpoint}</p>
      </div>
    </div>
  `;
    })
    .join('');

  return `
  <section>
    <h2 class="text-xl font-semibold mb-4">Your Catalogs</h2>
    ${
      catalogs.length === 0
        ? '<div class="p-4 rounded-lg bg-secondary/50 text-muted-foreground">No catalogs added yet. Add some catalogs to get started.</div>'
        : `<div id="catalog-list" class="grid grid-cols-1 gap-4">${catalogRows}</div>`
    }
    ${
      catalogs.length > 1
        ? `<div class="mt-4 p-4 rounded-lg bg-secondary/50 border-l-4 border-primary">
            <p class="text-sm text-muted-foreground">
              <strong>Hint:</strong> <span class="md:inline hidden">You can reorder the catalogs by dragging and dropping them.</span>
              <span class="md:hidden">Use the arrow buttons to reorder catalogs.</span>
            </p>
          </div>`
        : ''
    }
  </section>
  `;
}
