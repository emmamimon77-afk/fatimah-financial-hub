// ~/fatimah-financial-hub/public/dashboard.js
// Dashboard JavaScript for Fatimah Financial Hub
// FRED API Integration & Real-time Updates

class FatimahDashboard {
    constructor() {
        this.apiBase = 'https://api.stlouisfed.org/fred';
        this.apiKey = 'YOUR_FRED_API_KEY'; // Replace with actual key
        this.currencies = ['SAR', 'TRY', 'AED', 'IDR', 'KWD', 'QAR'];
        this.init();
    }

    async init() {
        await this.fetchFREDData();
        this.setupEventListeners();
        this.startRealTimeUpdates();
        this.loadDashboardStats();
    }

    async fetchFREDData() {
        try {
            // Fetch US Treasury rates
            const treasuries = await this.getTreasuryRates();
            // Fetch exchange rates
            const rates = await this.getExchangeRates();
            
            this.updateCurrencyDisplay(rates);
            this.updateEconomicIndicators(treasuries);
        } catch (error) {
            console.error('FRED API Error:', error);
        }
    }

    async getTreasuryRates() {
        // Simulated FRED API call - replace with actual
        return {
            '10Year': '4.12',
            '2Year': '4.45',
            '30Year': '4.28'
        };
    }

    async getExchangeRates() {
        // Simulated exchange rates - replace with actual FRED calls
        return {
            'SAR': 3.7502,
            'TRY': 32.4512,
            'AED': 3.6729,
            'IDR': 15670,
            'KWD': 0.308,
            'QAR': 3.641
        };
    }

    updateCurrencyDisplay(rates) {
        const currencyElements = document.querySelectorAll('[data-currency]');
        currencyElements.forEach(el => {
            const currency = el.dataset.currency;
            if (rates[currency]) {
                el.textContent = rates[currency].toFixed(4);
            }
        });
    }

    updateEconomicIndicators(treasuries) {
        const treasuryEl = document.getElementById('treasury-rate');
        if (treasuryEl) {
            treasuryEl.textContent = `${treasuries['10Year']}%`;
        }
    }

    setupEventListeners() {
        // Dashboard filter buttons
        document.querySelectorAll('.time-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.updateTimeRange(e.target.dataset.range);
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.fetchFREDData());
        }
    }

    startRealTimeUpdates() {
        // Update every 60 seconds
        setInterval(() => this.fetchFREDData(), 60000);
    }

    loadDashboardStats() {
        // Load statistics from your backend
        this.updateKPIs();
        this.loadRecentActivity();
    }

    updateKPIs() {
        // Simulate KPI updates - replace with actual API calls
        const kpis = {
            totalAssets: 847000000,
            activeContracts: 2847,
            profitDistribution: 12400000,
            newContractsThisWeek: 124
        };

        // Update DOM with KPI values
        document.querySelectorAll('[data-kpi]').forEach(el => {
            const kpi = el.dataset.kpi;
            if (kpis[kpi]) {
                if (kpi === 'totalAssets' || kpi === 'profitDistribution') {
                    el.textContent = `$${(kpis[kpi] / 1000000).toFixed(1)}M`;
                } else {
                    el.textContent = kpis[kpi].toLocaleString();
                }
            }
        });
    }

    loadRecentActivity() {
        // Simulated recent activities - replace with actual API
        const activities = [
            {
                type: 'murabaha',
                title: 'New Murabaha contract',
                description: 'ABC Corp • $2.4M • 5 years',
                time: '2 minutes ago',
                icon: 'file-invoice',
                color: 'blue'
            },
            {
                type: 'ijara',
                title: 'Ijara lease matured',
                description: 'Residential complex • $890K',
                time: '15 minutes ago',
                icon: 'home',
                color: 'green'
            },
            {
                type: 'mudaraba',
                title: 'Mudaraba profit distribution',
                description: '12 investors • $156K total',
                time: '1 hour ago',
                icon: 'hand-holding-usd',
                color: 'purple'
            }
        ];

        const activityContainer = document.getElementById('recent-activity');
        if (activityContainer) {
            activityContainer.innerHTML = activities.map(a => `
                <div class="flex items-start space-x-3">
                    <div class="bg-${a.color}-100 p-2 rounded-lg">
                        <i class="fas fa-${a.icon} text-${a.color}-600"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-800">${a.title}</p>
                        <p class="text-xs text-gray-500">${a.description}</p>
                        <span class="text-xs text-emerald-600">${a.time}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    updateTimeRange(range) {
        console.log(`Updating time range to: ${range}`);
        // Implement actual data fetching based on time range
        this.fetchFREDData();
    }

    exportReport(format) {
        console.log(`Exporting report as ${format}`);
        // Implement report generation logic
    }

    generateComplianceReport() {
        console.log('Generating Shariah compliance report');
        // Implement compliance report generation
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new FatimahDashboard();
});
