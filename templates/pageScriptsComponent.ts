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
  </script>
  `;
}
