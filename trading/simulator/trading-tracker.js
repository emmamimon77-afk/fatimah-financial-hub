/**
 * PRIVATE TRADING TRACKER - For Admin Use Only
 * Tracks user signups, trades, and page visits
 * Data is stored locally and only accessible by admin
 */

const TradingTracker = (function() {
    // Get current username
    function getCurrentUser() {
        try {
            const userData = localStorage.getItem('trading_user');
            if (userData) {
                const user = JSON.parse(userData);
                return user.username || 'anonymous';
            }
        } catch (e) {
            console.error('Error getting current user:', e);
        }
        return 'anonymous';
    }

    // Storage keys
    const STORAGE_KEYS = {
        USERS: 'admin_trading_users_v2',
        VISITS: 'admin_page_visits_v2',
        TRADES: () => `admin_trades_${getCurrentUser()}_v2`
    };

    // Track new user signup
    function trackUser(user) {
        try {
            const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
            
            // Check if user already exists
            const existingUserIndex = users.findIndex(u => u.username === user.username);
            
            if (existingUserIndex !== -1) {
                // Update existing user
                users[existingUserIndex] = {
                    ...users[existingUserIndex],
                    ...user,
                    lastActive: new Date().toISOString(),
                    loginCount: (users[existingUserIndex].loginCount || 0) + 1
                };
            } else {
                // Add new user
                users.push({
                    ...user,
                    userId: user.id || 'user_' + Date.now(),
                    trackedAt: new Date().toISOString(),
                    loginCount: 1
                });
            }
            
            // Keep last 1000 users
            if (users.length > 1000) users.shift();
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
            
            console.log(`📊 User tracked: ${user.username}`);
            return true;
        } catch (error) {
            console.error('Error tracking user:', error);
            return false;
        }
    }

    // Track page visit (public pages)
    function trackVisit(page) {
        try {
            const visits = JSON.parse(localStorage.getItem(STORAGE_KEYS.VISITS) || '[]');
            
            visits.push({
                page: page,
                timestamp: new Date().toISOString(),
                referrer: document.referrer || 'direct',
                userAgent: navigator.userAgent.substring(0, 100) // Truncate for privacy
            });
            
            // Keep last 1000 visits
            if (visits.length > 1000) visits.shift();
            localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
            
            return true;
        } catch (error) {
            console.error('Error tracking visit:', error);
            return false;
        }
    }

    // Track trade - now user-specific
    function trackTrade(userId, tradeData) {
        try {
            const key = STORAGE_KEYS.TRADES();
            const trades = JSON.parse(localStorage.getItem(key) || '[]');
            
            trades.push({
                userId: userId,
                username: getCurrentUser(),
                ...tradeData,
                timestamp: new Date().toISOString(),
                tradeId: 'trade_' + Date.now() + Math.random().toString(36).substr(2, 5)
            });
            
            // Keep last 100 trades per user
            if (trades.length > 100) trades.shift();
            localStorage.setItem(key, JSON.stringify(trades));
            
            return true;
        } catch (error) {
            console.error('Error tracking trade:', error);
            return false;
        }
    }

    // Get user-specific trades (for admin)
    function getUserTrades(username) {
        try {
            const key = `admin_trades_${username}_v2`;
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch {
            return [];
        }
    }

    // Get stats (for admin only)
    function getStats() {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const visits = JSON.parse(localStorage.getItem(STORAGE_KEYS.VISITS) || '[]');
        
        // Calculate active today
        const today = new Date().toDateString();
        const activeToday = users.filter(u => 
            new Date(u.lastActive).toDateString() === today
        ).length;
        
        // Calculate popular pages
        const pageCounts = {};
        visits.slice(-200).forEach(v => {
            pageCounts[v.page] = (pageCounts[v.page] || 0) + 1;
        });
        
        const popularPages = Object.entries(pageCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([page, count]) => ({ page, count }));
        
        return {
            totalUsers: users.length,
            activeToday: activeToday,
            popularPages: popularPages,
            lastUpdated: new Date().toISOString()
        };
    }

    // Admin only - clear data
    function clearAllData() {
        if (confirm('⚠️ Clear all tracking data?')) {
            localStorage.removeItem(STORAGE_KEYS.USERS);
            localStorage.removeItem(STORAGE_KEYS.VISITS);
            console.log('📊 All tracking data cleared');
            return true;
        }
        return false;
    }

    // Public API
    return {
        trackUser: trackUser,
        trackVisit: trackVisit,
        trackTrade: trackTrade,
        getUserTrades: getUserTrades,
        getStats: getStats,
        clearAllData: clearAllData
    };
})();

// Auto-track page visits on all pages
document.addEventListener('DOMContentLoaded', function() {
    const page = window.location.pathname;
    if (typeof TradingTracker !== 'undefined' && TradingTracker.trackVisit) {
        TradingTracker.trackVisit(page);
    }
});

// Make available globally
window.TradingTracker = TradingTracker;

console.log('📊 Trading Tracker initialized (private)');
