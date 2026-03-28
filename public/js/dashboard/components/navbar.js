// Navigation Component
class DashboardNavbar {
    constructor() {
        this.container = document.getElementById('navbar-container');
    }

    render() {
        this.container.innerHTML = `
            <nav class="navbar">
                <div class="logo">🌍 Fatimah Financial Hub</div>
                <div class="nav-links">
                    <a href="/" class="active">Dashboard</a>
                    <a href="/finance-tools/global">Calculators</a>
                    <a href="/finance-tools/islamic">Islamic Finance</a>
                    <a href="/telephony/simple.html">Community</a>
                    <a href="/trading">Trading</a>
                </div>
            </nav>
        `;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.DashboardNavbar = DashboardNavbar;
}
