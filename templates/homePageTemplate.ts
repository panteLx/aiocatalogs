/**
 * Home page template for the configuration page
 */
import { getHTMLHead, getBodyOpeningHTML, getBodyClosingHTML } from './pageStructureComponents';
import { getFooterHTML } from './footerComponent';

/**
 * Creates the HTML for the home page
 */
export function getHomePageHTML(
  message: string = '',
  error: string = '',
  packageVersion: string = '1.0.0'
) {
  return `
    ${getHTMLHead('AIOCatalogs - User Selection')}
    ${getBodyOpeningHTML('')}
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <header class="py-8 md:py-12">
        <div class="flex flex-col space-y-6">
          <div class="flex flex-col items-center md:items-start">
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              AIOCatalogs
            </h1>
            <p class="mt-1 text-xl text-muted-foreground">
              User Selection
            </p>
          </div>
        </div>
        <div id="notifications" class="mt-6"></div>
      </header>

      <div class="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto mt-8">
        <div class="rounded-lg border bg-card p-6 shadow-card">
          <div class="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary mr-2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <h2 class="text-xl font-semibold">New User</h2>
          </div>
          <p class="text-muted-foreground mb-6">
            Create a new configuration for your catalogs.
          </p>
          <form method="POST" action="/configure/create">
            <button
              type="submit"
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full shadow-subtle"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
              Create New Configuration
            </button>
          </form>
        </div>

        <div class="rounded-lg border bg-card p-6 shadow-card">
          <div class="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary mr-2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <h2 class="text-xl font-semibold">Existing User</h2>
          </div>
          <p class="text-muted-foreground mb-4">Load your existing catalog configuration.</p>
          <form method="POST" action="/configure/load">
            <div class="grid gap-4">
              <div class="grid gap-2">
                <label for="userId" class="text-sm font-medium flex items-center">
                  <span>Your User ID</span>
                  <span class="ml-1 text-destructive">*</span>
                </label>
                <div class="relative">
                  <input
                    type="text"
                    id="userId"
                    name="userId"
                    required
                    placeholder="Enter your user ID..."
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                  />
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                      <polyline points="10 17 15 12 10 7"></polyline>
                      <line x1="15" y1="12" x2="3" y2="12"></line>
                    </svg>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 w-full shadow-subtle"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                  <path d="M9 18l6-6-6-6"></path>
                </svg>
                Load Configuration
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div class="mt-8 p-4 rounded-lg bg-secondary/30 border border-border shadow-subtle mx-auto max-w-3xl">
        <div class="flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary mt-0.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <p class="text-sm text-muted-foreground">
            <span class="font-medium text-foreground">Note:</span> Your user ID will be stored in your browser. Make sure to save it somewhere safe if you want to access your configuration from other devices.
          </p>
        </div>
      </div>
    </div>

    ${getFooterHTML(packageVersion)}
    
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

      // Show toasts if there are messages or errors and set up saved ID
      document.addEventListener('DOMContentLoaded', function() {
        ${message ? `showToast("${message}", "success");` : ''}
        ${error ? `showToast("${error}", "error");` : ''}
        
        // Set up the user ID field with the saved value if available
        console.log("Checking for saved user ID in localStorage");
        const savedUserId = localStorage.getItem('aioCatalogsUserId');
        console.log("Saved user ID from localStorage:", savedUserId);
        
        const userIdField = document.getElementById('userId');
        
        if (savedUserId && savedUserId.trim().length > 0) {
          console.log("Setting userId field value:", savedUserId);
          userIdField.value = savedUserId;
        }
      });
    </script>
    ${getBodyClosingHTML()}
  `;
}
