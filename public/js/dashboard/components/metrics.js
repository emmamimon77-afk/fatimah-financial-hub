// Key Performance Indicators Component
class DashboardMetrics {
    constructor() {
        this.container = document.getElementById('metrics-container');
        this.updateTime = document.getElementById('last-update');
        this.metrics = {};
    }

    async initialize() {
        await this.loadRealData();
        this.render();
        this.startUpdates();
    }

    async loadRealData() {
        try {
            // Try to get real data from existing FRED API
            if (window.RealTimeRates) {
                console.log('Attempting to fetch real market data...');
                const rates = await window.RealTimeRates.fetchUSRates();
                console.log('Rates object received:', rates);
                
                if (rates && rates.sp500Level) {
                    console.log('Real S&P 500 data received:', rates.sp500Level);
                    
                    // Calculate changes (simulated for now - could get from API)
                    const sp500Change = ((rates.sp500Level - 6900) / 6900 * 100).toFixed(1);
                    
                    this.metrics = {
                        sp500: { 
                            value: rates.sp500Level, 
                            change: parseFloat(sp500Change) || 1.2 
                        },
                        dowJones: { 
                            value: 37545.33, 
                            change: 0.8 
                        },
                        nasdaq: { 
                            value: 14972.76, 
                            change: 1.5 
                        },
                        islamicIndex: { 
                            value: 2345.67, 
                            change: 0.9 
                        },
                        vix: { 
                            value: 14.32, 
                            change: -3.2 
                        }
                    };
                    
                    console.log('Using real FRED data for metrics');
                    return;
                } else {
                    console.log('FRED API returned no S&P 500 data');
                }
            } else {
                console.log('RealTimeRates not available');
            }
        } catch (error) {
            console.log('Error fetching real data, using simulated:', error);
        }


        // Fallback to simulated data
        console.log('Using simulated metrics data');
        this.metrics = {
            sp500: { value: 4783.45, change: 1.2 },
            dowJones: { value: 37545.33, change: 0.8 },
            nasdaq: { value: 14972.76, change: 1.5 },
            islamicIndex: { value: 2345.67, change: 0.9 },
            vix: { value: 14.32, change: -3.2 }
        };
    }

    render() {
        const now = new Date();
        this.updateTime.textContent = `Updated: ${now.toLocaleTimeString()}`;

        this.container.innerHTML = `
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">S&P 500</div>
                    <div class="metric-value">${this.formatNumber(this.metrics.sp500.value)}</div>
                    <div class="metric-change ${this.metrics.sp500.change >= 0 ? 'positive' : 'negative'}">
                        <span>${this.metrics.sp500.change >= 0 ? '▲' : '▼'}</span>
                        <span>${this.metrics.sp500.change >= 0 ? '+' : ''}${this.metrics.sp500.change.toFixed(1)}%</span>
                    </div>
                </div>

                <div class="metric-card">
                    <div class="metric-label">Dow Jones</div>
                    <div class="metric-value">${this.formatNumber(this.metrics.dowJones.value)}</div>
                    <div class="metric-change ${this.metrics.dowJones.change >= 0 ? 'positive' : 'negative'}">
                        <span>${this.metrics.dowJones.change >= 0 ? '▲' : '▼'}</span>
                        <span>${this.metrics.dowJones.change >= 0 ? '+' : ''}${this.metrics.dowJones.change.toFixed(1)}%</span>
                    </div>
                </div>

                <div class="metric-card">
                    <div class="metric-label">NASDAQ</div>
                    <div class="metric-value">${this.formatNumber(this.metrics.nasdaq.value)}</div>
                    <div class="metric-change ${this.metrics.nasdaq.change >= 0 ? 'positive' : 'negative'}">
                        <span>${this.metrics.nasdaq.change >= 0 ? '▲' : '▼'}</span>
                        <span>${this.metrics.nasdaq.change >= 0 ? '+' : ''}${this.metrics.nasdaq.change.toFixed(1)}%</span>
                    </div>
                </div>

                <div class="metric-card">
                    <div class="metric-label">Islamic Finance Index</div>
                    <div class="metric-value">${this.formatNumber(this.metrics.islamicIndex.value)}</div>
                    <div class="metric-change ${this.metrics.islamicIndex.change >= 0 ? 'positive' : 'negative'}">
                        <span>${this.metrics.islamicIndex.change >= 0 ? '▲' : '▼'}</span>
                        <span>${this.metrics.islamicIndex.change >= 0 ? '+' : ''}${this.metrics.islamicIndex.change.toFixed(1)}%</span>
                    </div>
                </div>

                <div class="metric-card">
                    <div class="metric-label">Sukuk Market Cap</div>
                    <div class="metric-value">$786B</div>
                    <div class="metric-change positive">
                        <span>▲</span>
                        <span>+2.1%</span>
                    </div>
                </div>

                <div class="metric-card">
                    <div class="metric-label">Global VIX (Fear Index)</div>
                    <div class="metric-value">${this.metrics.vix.value}</div>
                    <div class="metric-change negative">
                        <span>▼</span>
                        <span>${this.metrics.vix.change.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    formatNumber(num) {
        if (num >= 1000) {
            return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return num.toFixed(2);
    }

    startUpdates() {
        // Update every 30 seconds
        setInterval(() => {
            this.simulatePriceChange();
            this.render();
        }, 30000);
    }

    simulatePriceChange() {
        Object.keys(this.metrics).forEach(key => {
            if (key !== 'vix') {
                const randomChange = (Math.random() - 0.5) * 0.2;
                this.metrics[key].value *= (1 + randomChange / 100);
                this.metrics[key].change += randomChange;
            }
        });
    }
}

// Export
if (typeof window !== 'undefined') {
    window.DashboardMetrics = DashboardMetrics;
}
