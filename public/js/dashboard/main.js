// Main Dashboard Initializer
class DashboardApp {
    constructor() {
        this.components = {};
        console.log('DashboardApp initialized');
    }

    async initialize() {
        console.log('Starting dashboard initialization...');
        
        try {
            // Load and initialize components in order
            await this.loadComponents();
            
            // Initialize each component
            await this.initializeComponents();
            
            console.log('Dashboard initialized successfully');
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
        }
    }

    async loadComponents() {
        // Load component classes if they exist
        if (typeof DashboardNavbar !== 'undefined') {
            this.components.navbar = new DashboardNavbar();
        }

        if (typeof DashboardHero !== 'undefined') {
            this.components.hero = new DashboardHero();
        }
        
        if (typeof DashboardMetrics !== 'undefined') {
            this.components.metrics = new DashboardMetrics();
        }

        if (typeof DashboardMarkets !== 'undefined') {
            this.components.markets = new DashboardMarkets();
        }

        if (typeof DashboardQuickActions !== 'undefined') {
            this.components.quickActions = new DashboardQuickActions();
        }

        if (typeof DashboardComparison !== 'undefined') {
            this.components.comparison = new DashboardComparison();
        }
        
        // Add more components as we create them
        console.log('Components loaded:', Object.keys(this.components));
    }

    async initializeComponents() {
        // Initialize each component
        if (this.components.navbar) {
            this.components.navbar.render();
        }
        
        if (this.components.hero) {
            this.components.hero.render();
        }       

        if (this.components.metrics) {
            await this.components.metrics.initialize();
        }
        
        if (this.components.markets) {
            this.components.markets.initialize();
        }
  
        if (this.components.quickActions) {
            this.components.quickActions.render();
        }

        if (this.components.comparison) {
            this.components.comparison.render();
        }

        // Initialize other components here
        console.log('All components initialized');
    }
}


// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting dashboard...');
    const app = new DashboardApp();
    app.initialize();
});
