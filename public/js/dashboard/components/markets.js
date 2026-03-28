// Markets Overview Component
class DashboardMarkets {
    constructor() {
        this.container = document.getElementById('markets-container');
        this.tabsContainer = document.getElementById('market-tabs-container');
        this.currentTab = 'western';
        
        // Sample data - in production, this would come from APIs
        this.marketData = {
            western: [
                { name: 'Apple Inc.', symbol: 'AAPL', price: 185.92, change: 1.34, changePercent: 0.73, type: 'stock' },
                { name: 'Microsoft Corp.', symbol: 'MSFT', price: 378.91, change: 4.56, changePercent: 1.22, type: 'tech' },
                { name: 'S&P 500 ETF', symbol: 'SPY', price: 483.45, change: 2.34, changePercent: 0.49, type: 'etf' },
                { name: 'Tesla Inc.', symbol: 'TSLA', price: 248.48, change: 5.92, changePercent: 2.44, type: 'auto' },
                { name: 'JPMorgan Chase', symbol: 'JPM', price: 172.34, change: -0.87, changePercent: -0.50, type: 'bank' },
                { name: 'Goldman Sachs', symbol: 'GS', price: 389.21, change: 3.45, changePercent: 0.89, type: 'bank' }
            ],
            islamic: [
                { name: 'Saudi Aramco', symbol: '2222.SR', price: 32.45, change: 0.23, changePercent: 0.71, type: 'energy' },
                { name: 'Al Rajhi Bank', symbol: '1120.SR', price: 89.50, change: 1.10, changePercent: 1.24, type: 'bank' },
                { name: 'Dubai Islamic Bank', symbol: 'DIB', price: 5.84, change: 0.08, changePercent: 1.39, type: 'bank' },
                { name: 'Kuwait Finance House', symbol: 'KFH', price: 0.715, change: 0.005, changePercent: 0.70, type: 'bank' },
                { name: 'Qatar Islamic Bank', symbol: 'QIBK', price: 18.92, change: -0.12, changePercent: -0.63, type: 'bank' },
                { name: 'Masraf Al Rayan', symbol: 'MARK', price: 3.45, change: 0.04, changePercent: 1.17, type: 'bank' }
            ],
            global: [
                { name: 'FTSE 100', symbol: 'FTSE', price: 7789.45, change: 45.23, changePercent: 0.58, type: 'index' },
                { name: 'DAX', symbol: 'DAX', price: 16523.89, change: -23.45, changePercent: -0.14, type: 'index' },
                { name: 'Nikkei 225', symbol: 'N225', price: 33464.17, change: 234.56, changePercent: 0.71, type: 'index' },
                { name: 'Hang Seng', symbol: 'HSI', price: 16256.34, change: -89.12, changePercent: -0.55, type: 'index' },
                { name: 'S&P/ASX 200', symbol: 'AXJO', price: 7567.89, change: 34.56, changePercent: 0.46, type: 'index' },
                { name: 'TSX Composite', symbol: 'TSX', price: 21034.56, change: 123.45, changePercent: 0.59, type: 'index' }
            ]
        };
    }

    initialize() {
        this.renderTabs();
        this.renderMarkets();
        this.startUpdates();
    }

    renderTabs() {
        this.tabsContainer.innerHTML = `
            <div class="tab-buttons">
                <button class="tab-btn ${this.currentTab === 'western' ? 'active' : ''}" 
                        onclick="window.dashboardMarkets.switchTab('western')">
                    Western Markets
                </button>
                <button class="tab-btn ${this.currentTab === 'islamic' ? 'active' : ''}" 
                        onclick="window.dashboardMarkets.switchTab('islamic')">
                    Islamic Markets
                </button>
                <button class="tab-btn ${this.currentTab === 'global' ? 'active' : ''}" 
                        onclick="window.dashboardMarkets.switchTab('global')">
                    Global Indices
                </button>
            </div>
        `;
    }

    switchTab(tab) {
        this.currentTab = tab;
        this.renderTabs();
        this.renderMarkets();
    }

    renderMarkets() {
        const markets = this.marketData[this.currentTab];
        const marketType = this.currentTab.charAt(0).toUpperCase() + this.currentTab.slice(1);
        
        this.container.innerHTML = `
            <div class="market-grid">
                ${markets.map(market => `
                    <div class="market-card">
                        <div class="market-item">
                            <div class="market-info">
                                <div class="market-name">${market.name}</div>
                                <div class="market-symbol">${market.symbol}</div>
                                <div class="market-type">${market.type.toUpperCase()}</div>
                            </div>
                            <div class="market-price">
                                <div class="price-value">${this.formatPrice(market.price)}</div>
                                <div class="price-change ${market.change >= 0 ? 'positive' : 'negative'}">
                                    ${market.change >= 0 ? '▲' : '▼'} 
                                    ${Math.abs(market.change).toFixed(2)} 
                                    (${market.change >= 0 ? '+' : ''}${market.changePercent.toFixed(2)}%)
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    formatPrice(price) {
        if (price < 1) {
            return price.toFixed(3);
        } else if (price < 100) {
            return price.toFixed(2);
        } else {
            return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    }

    startUpdates() {
        // Simulate real-time updates
        setInterval(() => {
            this.simulatePriceChanges();
            this.renderMarkets();
        }, 15000); // Update every 15 seconds
    }

    simulatePriceChanges() {
        Object.keys(this.marketData).forEach(tab => {
            this.marketData[tab].forEach(market => {
                // Small random price change
                const randomChange = (Math.random() - 0.5) * 0.5;
                market.price *= (1 + randomChange / 100);
                market.change += randomChange;
                market.changePercent += randomChange;
                
                // Keep changes reasonable
                if (Math.abs(market.changePercent) > 5) {
                    market.changePercent = market.changePercent > 0 ? 4.5 : -4.5;
                }
            });
        });
    }
}

// Export and make globally accessible
if (typeof window !== 'undefined') {
    window.DashboardMarkets = DashboardMarkets;
    // Create global reference for tab switching from HTML
    window.dashboardMarkets = new DashboardMarkets();
}
