const API_BASE = 'http://localhost:3001/api';

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    setupModal();
});

// Load statistics
async function loadStats() {
    try {
        // Load nonprofits count
        const nonprofits = await fetch(`${API_BASE}/nonprofits`).then(r => r.json());
        document.getElementById('nonprofit-count').textContent = Array.isArray(nonprofits) ? nonprofits.length : 0;

        // Load transactions count
        const transactions = await fetch(`${API_BASE}/transactions`).then(r => r.json());
        document.getElementById('transaction-count').textContent = Array.isArray(transactions) ? transactions.length : 0;

        // Load collections count
        const collections = await fetch(`${API_BASE}/collections`).then(r => r.json());
        document.getElementById('collection-count').textContent = collections.totalCollections || 0;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Show collections modal
async function showCollections() {
    try {
        const response = await fetch(`${API_BASE}/collections`);
        const data = await response.json();
        
        const collectionsHtml = data.collections.map(collection => `
            <div class="collection-item">
                <div class="collection-name">${collection.name}</div>
                <div class="collection-info">
                    Documents: ${collection.documentCount} | Type: ${collection.type || 'collection'}
                </div>
            </div>
        `).join('');
        
        document.getElementById('collections-list').innerHTML = `
            <h3>Database: ${data.database}</h3>
            <p>Total Collections: ${data.totalCollections}</p>
            ${collectionsHtml}
        `;
        
        document.getElementById('collectionsModal').style.display = 'block';
        
    } catch (error) {
        console.error('Error fetching collections:', error);
        alert('Error loading collections. Make sure the backend is running.');
    }
}

// Setup modal functionality
function setupModal() {
    const modal = document.getElementById('collectionsModal');
    const closeBtn = document.getElementsByClassName('close')[0];
    
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }
    
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}

// Utility functions
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

function showLoading() {
    // Add loading indicators
    const stats = ['nonprofit-count', 'transaction-count', 'collection-count'];
    stats.forEach(id => {
        document.getElementById(id).textContent = '...';
    });
}