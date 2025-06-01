/**
 * Scripts component for the configuration page
 */

/**
 * Creates the HTML for the client-side JavaScript functionality
 */
export function getPageScriptsHTML(message: string = '', error: string = ''): string {
  return `
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

    // Save user ID to localStorage when page loads
    document.addEventListener('DOMContentLoaded', function() {
      // Get user ID from data attribute
      const userId = document.body.getAttribute('data-user-id');
      console.log("Storing userId in localStorage:", userId);
      localStorage.setItem('aioCatalogsUserId', userId);
      
      // Set up clear stored user button
      document.getElementById('clearStoredUserBtn').addEventListener('click', function() {
        localStorage.removeItem('aioCatalogsUserId');
        showToast('Stored user ID cleared. Next time you visit, you\\'ll need to enter it manually.', 'success');
      });
      
      // Show toasts if there are messages or errors
      ${message ? `showToast("${message}", "success");` : ''}
      ${error ? `showToast("${error}", "error");` : ''}

      const importWatchlistBtn = document.getElementById('importMDBListWatchlistBtn');
      const mdblistApiKeyInput = document.getElementById('mdblistApiKeyInput');

      if (importWatchlistBtn && mdblistApiKeyInput) {
        // Enable/disable import button based on API key input presence
        function toggleImportWatchlistButtonState() {
          if (mdblistApiKeyInput.value.trim() !== '') {
            importWatchlistBtn.disabled = false;
            importWatchlistBtn.title = '';
          } else {
            importWatchlistBtn.disabled = true;
            importWatchlistBtn.title = 'Enter and save an MDBList API key first to import watchlist.';
          }
        }

        // Initial state check
        toggleImportWatchlistButtonState();
        // Check on keyup as well
        mdblistApiKeyInput.addEventListener('keyup', toggleImportWatchlistButtonState);


        importWatchlistBtn.addEventListener('click', async function() {
          if (!userId) {
            showToast('User ID not found. Cannot import watchlist.', 'error');
            return;
          }
          // Check if API key is present in the input field, as it might have been entered but not saved
          const currentApiKey = mdblistApiKeyInput.value.trim();
          if (!currentApiKey) {
            showToast('MDBList API key is required to import watchlist. Please enter and save it first.', 'error');
            return;
          }

          this.disabled = true; // Disable button during processing
          this.innerHTML = '<svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Importing...';

          try {
            const response = await fetch(\`/configure/\${userId}/mdblist/import-watchlist\`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
                // No body needed if API key is read from server-side config
              },
            });

            const result = await response.json();

            if (response.ok && result.success) {
              showToast(result.message || 'Watchlist imported successfully! Reloading to see changes.', 'success');
              // Consider a less disruptive update if possible, but reload is simplest for now
              setTimeout(() => window.location.reload(), 2000);
            } else {
              showToast(result.error || 'Failed to import watchlist.', 'error');
            }
          } catch (err) {
            showToast('An error occurred while trying to import the watchlist.', 'error');
            console.error('Import watchlist error:', err);
          } finally {
            this.disabled = false; // Re-enable button
            this.innerHTML = '<svg>...</svg>Import Watchlist'; // Restore original button text/icon
          }
        });
      }

      // Check if it's a mobile device
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      
      // Set up drag and drop functionality only for desktop devices
      if (!isMobile) {
        setupDragAndDrop(userId);
        
        // Make items draggable on desktop
        document.querySelectorAll('[data-draggable="true"]').forEach(item => {
          item.setAttribute('draggable', 'true');
        });
      }
    });
    
    // Function to set up drag and drop
    function setupDragAndDrop(userId) {
      const catalogList = document.getElementById('catalog-list');
      if (catalogList) {
        let draggedItem = null;
        let sourceIndex = -1;
        
        // Add event listeners to all catalog items
        const catalogItems = document.querySelectorAll('.catalog-item');
        catalogItems.forEach((item) => {
          // Drag start
          item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            sourceIndex = parseInt(this.getAttribute('data-catalog-index'));
            // Set a timeout to add opacity class
            setTimeout(() => {
              this.classList.add('opacity-50');
            }, 0);
          });
          
          // Drag end
          item.addEventListener('dragend', function() {
            this.classList.remove('opacity-50');
            draggedItem = null;
            sourceIndex = -1;
            // Update the index numbers visually
            updateIndexNumbers();
          });
          
          // Drag over
          item.addEventListener('dragover', function(e) {
            e.preventDefault();
            if (draggedItem === this) return;
            this.classList.add('bg-accent');
          });
          
          // Drag leave
          item.addEventListener('dragleave', function() {
            this.classList.remove('bg-accent');
          });
          
          // Drag drop
          item.addEventListener('drop', async function(e) {
            e.preventDefault();
            this.classList.remove('bg-accent');
            
            if (draggedItem === this) return;
            
            const targetIndex = parseInt(this.getAttribute('data-catalog-index'));
            const draggedId = draggedItem.getAttribute('data-catalog-id');
            
            // If dragging downwards, insert after the target item
            if (sourceIndex < targetIndex) {
              catalogList.insertBefore(draggedItem, this.nextSibling);
            } 
            // If dragging upwards, insert before the target item
            else {
              catalogList.insertBefore(draggedItem, this);
            }
            
            // Update the backend using the existing moveUp/moveDown functions
            await updateCatalogOrder(draggedId, sourceIndex, targetIndex, userId);
          });
        });
      }
    }
    
    // Function to update backend catalog order
    async function updateCatalogOrder(catalogId, fromIndex, toIndex, userId) {
      const steps = Math.abs(toIndex - fromIndex);
      const moveDirection = fromIndex < toIndex ? 'down' : 'up';
      const moveEndpoint = moveDirection === 'down' ? 'moveDown' : 'moveUp';
      
      try {
        // Make the necessary number of move requests to get from source to target
        for (let i = 0; i < steps; i++) {
          const formData = new FormData();
          formData.append('catalogId', catalogId);
          
          await fetch('/configure/' + userId + '/' + moveEndpoint, {
            method: 'POST',
            body: formData
          });
        }
        
        showToast('Catalog position updated successfully', 'success');
        
        // Update the data-catalog-index attributes
        updateCatalogIndexAttributes();
        
      } catch (error) {
        console.error('Error updating catalog position:', error);
        showToast('Failed to update catalog position', 'error');
        
        // If error, reload the page to restore the correct order
        window.location.reload();
      }
    }
    
    // Function to update the numbered indicators
    function updateIndexNumbers() {
      document.querySelectorAll('.catalog-item').forEach((item, index) => {
        const indicator = item.querySelector('.catalog-handle span');
        if (indicator) {
          indicator.textContent = (index + 1).toString();
        }
      });
    }
    
    // Function to update data-catalog-index attributes
    function updateCatalogIndexAttributes() {
      document.querySelectorAll('.catalog-item').forEach((item, index) => {
        item.setAttribute('data-catalog-index', index.toString());
      });
    }

    // Function to show a flash message
    function showMessage(type, message) {
      // Remove any existing messages
      const existingMessages = document.querySelectorAll('.flash-message');
      existingMessages.forEach(element => {
        element.remove();
      });
      
      // Create the message element
      const messageElement = document.createElement('div');
      messageElement.className = \`flash-message flash-\${type} fixed top-4 right-4 p-4 rounded-lg shadow-lg max-w-md z-50\`;
      messageElement.innerHTML = \`
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            \${type === 'success' ? \`
              <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
            \` : type === 'error' ? \`
              <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
              </svg>
            \` : \`
              <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
              </svg>
            \`}
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">\${message}</p>
          </div>
          <div class="flex-shrink-0 ml-auto">
            <button type="button" onclick="this.parentElement.parentElement.remove()" class="inline-flex text-gray-400 hover:text-gray-500">
              <span class="sr-only">Close</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>
        </div>
      \`;
      
      // Add the message to the page
      document.body.appendChild(messageElement);
      
      // Remove after a delay
      setTimeout(() => {
        messageElement.remove();
      }, 5000);
    }
    
    // Toggle rename form visibility
    function toggleRenameForm(catalogId) {
      const form = document.getElementById('rename-form-' + catalogId);
      if (form) {
        form.classList.toggle('hidden');
        
        // If form is now visible, focus on the input field
        if (!form.classList.contains('hidden')) {
          const input = form.querySelector('input[name="newName"]');
          if (input) {
            input.focus();
            input.select();
          }
        }
      }
    }
  </script>
  `;
}
