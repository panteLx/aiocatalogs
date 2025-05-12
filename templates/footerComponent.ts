/**
 * Footer component for the configuration page
 */

/**
 * Creates the HTML for the footer section
 */
export function getFooterHTML(packageVersion: string): string {
  return `
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
  `;
}
