const API_BASE = 'http://localhost:3001/api';

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    setupModal();
});

// Load statistics with updated API structure
async function loadStats() {
    try {
        showLoading();

        // Load nonprofits count - Updated for new API structure
        const nonprofitResponse = await fetch(`${API_BASE}/nonprofits`);
        const nonprofitData = await nonprofitResponse.json();
        
        if (nonprofitData.success) {
            const nonprofits = nonprofitData.data || [];
            document.getElementById('nonprofit-count').textContent = nonprofits.length;
        } else {
            throw new Error('Failed to load nonprofits: ' + (nonprofitData.error || 'Unknown error'));
        }

        // Load transactions count - Updated for new API structure
        const transactionResponse = await fetch(`${API_BASE}/transactions`);
        const transactionData = await transactionResponse.json();
        
        if (transactionData.success) {
            const transactions = transactionData.data.transactions || [];
            document.getElementById('transaction-count').textContent = transactions.length;
        } else {
            // If transactions endpoint doesn't exist or returns error, show 0
            document.getElementById('transaction-count').textContent = '0';
        }

        // Load collections count - This endpoint structure is unchanged
        const collectionsResponse = await fetch(`${API_BASE}/collections`);
        const collections = await collectionsResponse.json();
        
        if (collections.success || collections.totalCollections !== undefined) {
            document.getElementById('collection-count').textContent = collections.totalCollections || 0;
        } else {
            document.getElementById('collection-count').textContent = '0';
        }

    } catch (error) {
        console.error('Error loading stats:', error);
        
        // Show error state with user-friendly message
        const errorElements = ['nonprofit-count', 'transaction-count', 'collection-count'];
        errorElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = 'Error';
                element.style.color = '#dc3545';
            }
        });

        // Show error message to user
        showErrorMessage('Unable to load statistics. Please ensure the server is running.');
    }
}

// Show collections modal with updated error handling
async function showCollections() {
    try {
        const response = await fetch(`${API_BASE}/collections`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
        }

        // Handle both old and new API response formats
        const collections = data.collections || [];
        const databaseName = data.database || 'charityguard';
        const totalCollections = data.totalCollections || collections.length;
        
        const collectionsHtml = collections.map(collection => `
            <div class="collection-item">
                <div class="collection-name">${collection.name}</div>
                <div class="collection-info">
                    Documents: ${collection.documentCount || 0} | Type: ${collection.type || 'collection'}
                    ${collection.error ? `<span style="color: #dc3545;"> - ${collection.error}</span>` : ''}
                </div>
            </div>
        `).join('');
        
        document.getElementById('collections-list').innerHTML = `
            <h3>Database: ${databaseName}</h3>
            <p>Total Collections: ${totalCollections}</p>
            <div style="max-height: 400px; overflow-y: auto;">
                ${collectionsHtml || '<p>No collections found.</p>'}
            </div>
        `;
        
        document.getElementById('collectionsModal').style.display = 'block';
        
    } catch (error) {
        console.error('Error fetching collections:', error);
        
        document.getElementById('collections-list').innerHTML = `
            <div style="color: #dc3545; padding: 20px; text-align: center;">
                <h3>❌ Error Loading Collections</h3>
                <p><strong>Error:</strong> ${error.message}</p>
                <p>Please ensure the CharityGuard server is running on localhost:3001</p>
                <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Retry Connection
                </button>
            </div>
        `;
        
        document.getElementById('collectionsModal').style.display = 'block';
    }
}

// Setup modal functionality
function setupModal() {
    const modal = document.getElementById('collectionsModal');
    if (!modal) return;
    
    const closeBtn = document.getElementsByClassName('close')[0];
    
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        }
    }
    
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}

// Utility functions
function formatNumber(num) {
    if (typeof num !== 'number') return num;
    return new Intl.NumberFormat().format(num);
}

function showLoading() {
    // Add loading indicators
    const stats = ['nonprofit-count', 'transaction-count', 'collection-count'];
    stats.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '...';
            element.style.color = '#666';
        }
    });
}

function showErrorMessage(message) {
    // Create or update error message element
    let errorDiv = document.getElementById('global-error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'global-error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            padding: 12px 20px;
            border: 1px solid #f5c6cb;
            border-radius: 8px;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(errorDiv);
    }
    
    errorDiv.innerHTML = `
        <strong>⚠️ Connection Error</strong><br>
        ${message}
        <button onclick="this.parentElement.style.display='none'" style="float: right; background: none; border: none; font-size: 18px; cursor: pointer; color: #721c24;">×</button>
    `;
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (errorDiv) errorDiv.style.display = 'none';
    }, 10000);
}

// Test backend connectivity (enhanced version)
async function testBackend() {
    const statusDiv = document.getElementById('status');
    if (!statusDiv) return;
    
    statusDiv.innerHTML = '🔄 Testing backend connection...';
    statusDiv.style.color = '#007bff';
    
    try {
        // Test API status endpoint
        const statusResponse = await fetch(`${API_BASE}/status`, { 
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!statusResponse.ok) {
            throw new Error(`HTTP ${statusResponse.status}: ${statusResponse.statusText}`);
        }
        
        const statusData = await statusResponse.json();
        
        // Test nonprofits endpoint
        const nonprofitResponse = await fetch(`${API_BASE}/nonprofits`);
        if (nonprofitResponse.ok) {
            const nonprofitData = await nonprofitResponse.json();
            if (nonprofitData.success) {
                const nonprofits = nonprofitData.data || [];
                const nonprofitElement = document.getElementById('nonprofit-count');
                if (nonprofitElement) {
                    nonprofitElement.textContent = nonprofits.length;
                }
            }
        }
        
        // Test transactions endpoint
        const txResponse = await fetch(`${API_BASE}/transactions`);
        if (txResponse.ok) {
            const txData = await txResponse.json();
            if (txData.success) {
                const transactions = txData.data.transactions || [];
                const transactionElement = document.getElementById('transaction-count');
                if (transactionElement) {
                    transactionElement.textContent = transactions.length;
                }
            }
        }
        
        // Test IRS database
        const irsResponse = await fetch(`${API_BASE}/collections/irsorgs/schema`);
        if (irsResponse.ok) {
            const irsData = await irsResponse.json();
            if (irsData.success || irsData.totalDocuments) {
                const irsElement = document.getElementById('irs-count');
                if (irsElement) {
                    irsElement.textContent = (irsData.totalDocuments || 0).toLocaleString() + '+';
                }
            }
        }
        
        statusDiv.innerHTML = `
            ✅ <strong>Backend Connection Successful!</strong><br>
            <small>
                Server: ${statusData.status || 'Running'}<br>
                Environment: ${statusData.environment || 'development'}<br>
                Version: ${statusData.version || '1.0.0'}<br>
                Time: ${new Date().toLocaleString()}
            </small>
        `;
        statusDiv.style.color = '#28a745';
        
    } catch (error) {
        console.error('Backend test failed:', error);
        statusDiv.innerHTML = `
            ❌ <strong>Backend Connection Failed</strong><br>
            <small>
                Error: ${error.message}<br>
                Please ensure CharityGuard server is running on localhost:3001<br>
                <button onclick="testBackend()" style="margin-top: 8px; padding: 4px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Retry Connection
                </button>
            </small>
        `;
        statusDiv.style.color = '#dc3545';
    }
}

// Export functions for global access
if (typeof window !== 'undefined') {
    window.loadStats = loadStats;
    window.showCollections = showCollections;
    window.testBackend = testBackend;
    window.formatNumber = formatNumber;
}