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
      const isRandomized = catalog.randomize === true;
      const displayName = catalog.customName || catalog.name;
      const isCustomNamed = !!catalog.customName;

      return `
    <div class="catalog-item flex items-start gap-3 group" data-draggable="true" data-catalog-id="${catalog.id}" data-catalog-index="${index}">
      <span class="catalog-handle inline-flex items-center justify-center rounded-md bg-muted/80 text-foreground h-9 w-9 sm:h-10 sm:w-10 text-sm font-semibold shrink-0 mt-1 md:cursor-grab group-hover:bg-primary/20 group-hover:text-primary">
        <span class="inline-flex items-center justify-center">${index + 1}</span>
      </span>
      <div class="flex flex-col space-y-3 p-4 sm:p-5 rounded-lg bg-card border border-border group-hover:border-primary/30 flex-grow min-w-0 shadow-subtle">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex-grow overflow-hidden min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-medium text-lg truncate max-w-full">
                ${displayName}
                ${isCustomNamed ? `<span class="text-xs text-muted-foreground">(Original: ${catalog.name})</span>` : ''}
              </h3>
            </div>
            <p class="text-sm text-muted-foreground">${catalog.description}</p>
            </div>
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            ${
              !isFirst && !isOnly
                ? `
            <form method="POST" action="/configure/${userId}/moveUp" class="flex-shrink-0 sm:hidden">
              <input type="hidden" name="catalogId" value="${catalog.id}">
              <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 w-9 p-2" aria-label="Move Up">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
              </button>
            </form>
            `
                : ''
            }
            ${
              !isLast && !isOnly
                ? `
            <form method="POST" action="/configure/${userId}/moveDown" class="flex-shrink-0 sm:hidden">
              <input type="hidden" name="catalogId" value="${catalog.id}">
              <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 w-9 p-2" aria-label="Move Down">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            </form>
            `
                : ''
            }
            <button type="button" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3 py-2" onclick="toggleRenameForm('${catalog.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
              Rename
            </button>
            <form method="POST" action="/configure/${userId}/toggleRandomize" class="flex-shrink-0">
              <input type="hidden" name="catalogId" value="${catalog.id}">
              <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isRandomized ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'} h-9 px-3 py-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"></path><path d="m18 2 4 4-4 4"></path><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"></path><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"></path><path d="m18 14 4 4-4 4"></path></svg>
                ${isRandomized ? 'Randomized' : 'Randomize'}
              </button>
            </form>
            <form method="POST" action="/configure/${userId}/remove" class="flex-shrink-0">
              <input type="hidden" name="catalogId" value="${catalog.id}">
              <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3 py-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                Remove
              </button>
            </form>
          </div>
        </div>
        <div id="rename-form-${catalog.id}" class="rename-form hidden mt-2 p-3 border border-border rounded-md bg-muted/30">
          <form method="POST" action="/configure/${userId}/rename" class="flex items-center gap-2" accept-charset="UTF-8">
            <input type="hidden" name="catalogId" value="${catalog.id}">
            <div class="flex-grow">
              <input
                type="text"
                name="newName"
                value="${catalog.customName || catalog.name}"
                placeholder="Enter new name"
                class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 py-2">
              Save
            </button>
            <button type="button" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3 py-2" onclick="toggleRenameForm('${catalog.id}')">
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
    })
    .join('');

  return `
  <section>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary mr-2">
          <path d="M20 7h-9"></path>
          <path d="M14 17H5"></path>
          <circle cx="17" cy="17" r="3"></circle>
          <circle cx="7" cy="7" r="3"></circle>
        </svg>
        Your Catalogs
      </h2>
      ${
        catalogs.length > 0
          ? `<span class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-sm font-medium bg-muted/40 border-border">
               ${catalogs.length} ${catalogs.length === 1 ? 'Catalog' : 'Catalogs'}
             </span>`
          : ''
      }
    </div>
    ${
      catalogs.length === 0
        ? `<div class="p-6 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground shadow-subtle">
             <div class="flex flex-col items-center space-y-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground/70"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><path d="M16 6.89A6.43 6.43 0 0 1 12 18a6.43 6.43 0 0 1-4-11.11A6.44 6.44 0 0 1 12 2c1.93 0 3.68.85 4.86 2.23"></path><path d="M6 9h6"></path></svg>
               <p>No catalogs added yet. Add some catalogs to get started.</p>
             </div>
           </div>`
        : `<div id="catalog-list" class="grid grid-cols-1 gap-4 animate-enter">${catalogRows}</div>`
    }
    ${
      catalogs.length > 1
        ? `<div class="mt-4 p-4 rounded-lg bg-secondary/30 border border-border shadow-subtle">
            <div class="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary mt-0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
              <p class="text-sm text-muted-foreground">
                <span class="font-medium text-foreground">Pro Tip:</span> <span class="sm:inline hidden">You can reorder catalogs by dragging and dropping them.</span>
                <span class="sm:hidden">Use the arrow buttons to reorder catalogs.</span>
              </p>
            </div>
          </div>`
        : ''
    }
  </section>
  `;
}
