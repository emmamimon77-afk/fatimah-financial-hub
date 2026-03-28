// Hero Section Component
class DashboardHero {
    constructor() {
        this.container = document.getElementById('hero-container');
    }

    render() {
        this.container.innerHTML = `
            <div class="hero-section">
                <h1>📊 Real-time Global Financial Dashboard</h1>
                <p>Comprehensive analysis of Western & Islamic finance systems with live market data</p>
                <div class="finance-tags">
                    <span class="tag western">● Western Finance</span>
                    <span class="tag islamic">● Islamic Finance</span>
                    <span class="tag comparative">● Comparative Analysis</span>
                </div>
                <div class="data-disclaimer">
                    📊 S&P 500 data from FRED API | Other data simulated for demonstration
                </div>
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.DashboardHero = DashboardHero;
}
