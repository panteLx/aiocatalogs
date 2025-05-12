/**
 * Page structure components for the configuration page
 */

/**
 * Creates the HTML for the document head with styles and meta tags
 */
export function getHTMLHead(title: string): string {
  return `
  <!DOCTYPE html>
  <html lang="en" class="dark">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <title>${title}</title>
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
                'sm': '640px',
                'md': '768px',
                'lg': '1024px',
                'xl': '1280px',
                '2xl': '1400px',
              },
            },
            extend: {
              colors: {
                border: 'hsl(240 3.7% 12%)',
                input: 'hsl(240 3.7% 12%)',
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
              animation: {
                'gradient': 'gradient 15s ease infinite',
                'fade-in': 'fade-in 0.5s ease-out',
              },
              keyframes: {
                gradient: {
                  '0%, 100%': { 'background-position': '0% 50%' },
                  '50%': { 'background-position': '100% 50%' }
                },
                'fade-in': {
                  '0%': { opacity: '0' },
                  '100%': { opacity: '1' }
                }
              },
              boxShadow: {
                'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px 0 rgba(0, 0, 0, 0.18)',
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.28)',
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

        html {
          scrollbar-color: hsl(240 3.7% 25%) hsl(240 10% 5.9%);
        }

        body {
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* Custom scrollbars for dark mode */
        ::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }

        ::-webkit-scrollbar-track {
          background: hsl(240 10% 5.9%);
        }

        ::-webkit-scrollbar-thumb {
          background: hsl(240 3.7% 25%);
          border-radius: 7px;
          border: 3px solid hsl(240 10% 5.9%);
        }

        ::-webkit-scrollbar-thumb:hover {
          background: hsl(240 3.7% 35%);
        }

        .bg-card-pattern {
          background-color: hsla(240, 10%, 5.9%, 1);
          background-image:
            radial-gradient(at 67% 27%, hsla(215, 98%, 61%, 0.05) 0px, transparent 50%),
            radial-gradient(at 0% 0%, hsla(343, 100%, 76%, 0.05) 0px, transparent 50%),
            radial-gradient(at 100% 100%, hsla(142.1, 70.6%, 45.3%, 0.05) 0px, transparent 50%);
        }
        
        /* Card styles without transitions */
        .hover-card {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.28);
        }

        /* Focus styles */
        :focus-visible {
          outline: 2px solid hsl(142.1 70.6% 45.3%);
          outline-offset: 2px;
        }

        /* Add animation to new elements */
        .animate-enter {
          animation: fade-in 0.3s ease-out;
        }
      </style>
    </head>
  `;
}

/**
 * Creates the HTML for the opening body tag with data attributes
 */
export function getBodyOpeningHTML(userId: string): string {
  return `<body class="min-h-screen bg-background text-foreground bg-card-pattern animate-fade-in" data-user-id="${userId}">`;
}

/**
 * Creates the HTML for the closing body tag
 */
export function getBodyClosingHTML(): string {
  return `
  </body>
</html>`;
}
