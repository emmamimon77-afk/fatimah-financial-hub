// Quick Actions Component
class DashboardQuickActions {
    constructor() {
        this.container = document.getElementById('quick-actions-container');
        this.actions = [
            {
                icon: '🧮',
                title: 'Global Calculators',
                description: 'Country-specific financial tools',
                link: '/finance-tools/global',
                color: '#667eea'
            },
            {
                icon: '☪️',
                title: 'Islamic Finance',
                description: 'Sharia-compliant calculators',
                link: '#', // Will create tomorrow
                color: '#43e97b'
            },
            {
                icon: '⚖️',
                title: 'Compare Systems',
                description: 'Western vs Islamic analysis',
                link: '#',
                color: '#f093fb'
            },
            {
                icon: '📈',
                title: 'Live Trading',
                description: 'Virtual trading simulator',
                link: '/trading',
                color: '#4facfe'
            },
            {
                icon: '🎓',
                title: 'Learn Finance',
                description: 'Educational resources',
                link: '#',
                color: '#30cfd0'
            },
            {
                icon: '🤝',
                title: 'Community',
                description: 'Trader discussions',
                link: '/telephony/simple.html',
                color: '#f5576c'
            }
        ];
    }

    render() {
        this.container.innerHTML = `
            <div class="section-header">
                <h2>🚀 Quick Actions</h2>
                <div class="subtitle">Access key features instantly</div>
            </div>
            <div class="quick-actions-grid">
                ${this.actions.map(action => `
                    <a href="${action.link}" class="action-card" style="--card-color: ${action.color}">
                        <div class="action-icon">${action.icon}</div>
                        <div class="action-content">
                            <h3>${action.title}</h3>
                            <p>${action.description}</p>
                            <div class="action-link">Explore →</div>
                        </div>
                    </a>
                `).join('')}
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.DashboardQuickActions = DashboardQuickActions;
}
