/**
 * ETHICAL TRADING SIMULATOR - ADVANCED UTILITIES
 * Portfolio management, performance analytics, and real-time updates
 */

const SimulatorUtils = (function() {
    // Get current username from localStorage
    function getCurrentUser() {
        try {
            const userData = localStorage.getItem('trading_user');
            if (userData) {
                const user = JSON.parse(userData);
                return user.username || 'default';
            }
        } catch (e) {
            console.error('Error getting current user:', e);
        }
        return 'default';
    }

    // LocalStorage keys - ALL must be functions now
    const STORAGE_KEYS = {
        PORTFOLIO: () => `ethical_trading_portfolio_${getCurrentUser()}`,
        TRANSACTIONS: () => `ethical_trading_transactions_${getCurrentUser()}`,
        BALANCE: () => `ethical_trading_balance_${getCurrentUser()}`,
        ALERTS: () => `ethical_trading_alerts_${getCurrentUser()}`,
        WATCHLIST: () => `ethical_trading_watchlist_${getCurrentUser()}`
    };

    // Initial state
    let portfolio = {
        positions: [],
        balance: 100000,
        initialBalance: 100000,
        lastUpdated: new Date().toISOString()
    };

    let transactions = [];
    let alerts = [];
    let watchlist = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'JNJ', 'ADBE', 'CRM'];

    // Load saved data
    function loadSavedData() {
        try {
            const currentUser = getCurrentUser();
            console.log(`📂 Loading data for user: ${currentUser}`);
            
            // IMPORTANT: Call the functions with ()
            const savedPortfolio = localStorage.getItem(STORAGE_KEYS.PORTFOLIO());
            if (savedPortfolio) {
                portfolio = JSON.parse(savedPortfolio);
                console.log(`✅ Portfolio loaded for ${currentUser}:`, portfolio);
            } else {
                // Reset to default for new user
                portfolio = {
                    positions: [],
                    balance: 100000,
                    initialBalance: 100000,
                    lastUpdated: new Date().toISOString()
                };
                console.log(`🆕 New portfolio created for ${currentUser}`);
            }

            const savedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS());
            if (savedTransactions) {
                transactions = JSON.parse(savedTransactions);
                console.log(`✅ Transactions loaded for ${currentUser}:`, transactions.length);
            } else {
                transactions = [];
            }

            const savedAlerts = localStorage.getItem(STORAGE_KEYS.ALERTS());
            if (savedAlerts) {
                alerts = JSON.parse(savedAlerts);
            } else {
                alerts = [];
            }

            const savedWatchlist = localStorage.getItem(STORAGE_KEYS.WATCHLIST());
            if (savedWatchlist) {
                watchlist = JSON.parse(savedWatchlist);
            } else {
                watchlist = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'JNJ', 'ADBE', 'CRM'];
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }

    // Save all data
    function saveAll() {
        try {
            const currentUser = getCurrentUser();
            // Call the functions with ()
            localStorage.setItem(STORAGE_KEYS.PORTFOLIO(), JSON.stringify(portfolio));
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS(), JSON.stringify(transactions));
            localStorage.setItem(STORAGE_KEYS.ALERTS(), JSON.stringify(alerts));
            localStorage.setItem(STORAGE_KEYS.WATCHLIST(), JSON.stringify(watchlist));
            console.log(`💾 Data saved for user: ${currentUser}`);
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    // Reset portfolio for current user only
    function resetPortfolio() {
        portfolio = {
            positions: [],
            balance: 100000,
            initialBalance: 100000,
            lastUpdated: new Date().toISOString()
        };
        transactions = [];
        alerts = [];
        watchlist = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'JNJ', 'ADBE', 'CRM'];
        saveAll();
        console.log(`🔄 Portfolio reset for user: ${getCurrentUser()}`);
        return this.getPortfolio();
    }

    // Export all data (include username in export)
    function exportAll() {
        const data = {
            username: getCurrentUser(),
            portfolio,
            transactions,
            alerts,
            watchlist,
            stats: this.calculateStats(),
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${getCurrentUser()}-portfolio-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Calculate performance metrics
    function calculatePerformanceMetrics() {
        const totalValue = portfolio.positions.reduce((sum, pos) => {
            return sum + (pos.quantity * (pos.currentPrice || pos.avgPrice));
        }, 0);

        const totalCost = portfolio.positions.reduce((sum, pos) => {
            return sum + (pos.quantity * pos.avgPrice);
        }, 0);

        const totalPnL = totalValue - totalCost;
        const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

        // Calculate daily change
        const today = new Date().toDateString();
        const todayTransactions = transactions.filter(t => 
            new Date(t.timestamp).toDateString() === today
        );
        
        const dailyPnL = todayTransactions.reduce((sum, t) => {
            if (t.type === 'sell') {
                return sum + ((t.price - t.avgPrice) * t.quantity);
            }
            return sum;
        }, 0);

        // Win rate
        const winningTrades = transactions.filter(t => 
            t.type === 'sell' && t.price > t.avgPrice
        ).length;
        
        const totalTrades = transactions.filter(t => t.type === 'sell').length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

        // Best and worst performers
        const performers = portfolio.positions.map(pos => ({
            symbol: pos.symbol,
            pnl: (pos.currentPrice - pos.avgPrice) * pos.quantity,
            pnlPercent: ((pos.currentPrice - pos.avgPrice) / pos.avgPrice) * 100
        }));

        const bestPerformer = performers.length > 0 ? 
            performers.reduce((max, p) => p.pnl > max.pnl ? p : max) : null;
        
        const worstPerformer = performers.length > 0 ? 
            performers.reduce((min, p) => p.pnl < min.pnl ? p : min) : null;

        return {
            totalValue: totalValue + portfolio.balance,
            stockValue: totalValue,
            cashBalance: portfolio.balance,
            totalPnL,
            totalPnLPercent,
            positionsCount: portfolio.positions.length,
            dailyPnL,
            winRate,
            bestPerformer,
            worstPerformer,
            totalTrades: transactions.length,
            buyingPower: portfolio.balance
        };
    }

    // Public API
    return {
        init: function() {
            loadSavedData();
            return this;
        },

        getPortfolio: function() {
            return { ...portfolio };
        },

        getTransactions: function(limit = 50) {
            return [...transactions].slice(0, limit);
        },

        getBalance: function() {
            return portfolio.balance;
        },

        getPosition: function(symbol) {
            return portfolio.positions.find(p => p.symbol === symbol);
        },

        getWatchlist: function() {
            return [...watchlist];
        },

        addToWatchlist: function(symbol) {
            if (!watchlist.includes(symbol)) {
                watchlist.push(symbol);
                saveAll();
                return true;
            }
            return false;
        },

        removeFromWatchlist: function(symbol) {
            watchlist = watchlist.filter(s => s !== symbol);
            saveAll();
        },

        // Execute trade with advanced features
        executeTrade: function(trade) {
            console.log('📊 Executing trade:', trade);

            if (trade.type === 'buy') {
                const totalCost = trade.price * trade.quantity;
                
                if (totalCost > portfolio.balance) {
                    return { success: false, error: 'Insufficient funds' };
                }

                const existingPosition = portfolio.positions.find(p => p.symbol === trade.symbol);
                
                if (existingPosition) {
                    const totalShares = existingPosition.quantity + trade.quantity;
                    const totalCost_basis = (existingPosition.quantity * existingPosition.avgPrice) + totalCost;
                    
                    existingPosition.quantity = totalShares;
                    existingPosition.avgPrice = totalCost_basis / totalShares;
                    existingPosition.currentPrice = trade.price;
                } else {
                    portfolio.positions.push({
                        symbol: trade.symbol,
                        name: trade.name || trade.symbol,
                        quantity: trade.quantity,
                        avgPrice: trade.price,
                        currentPrice: trade.price,
                        purchaseDate: new Date().toISOString()
                    });
                }

                portfolio.balance -= totalCost;
            } 
            else if (trade.type === 'sell') {
                const position = portfolio.positions.find(p => p.symbol === trade.symbol);
                
                if (!position) {
                    return { success: false, error: 'Position not found' };
                }

                if (position.quantity < trade.quantity) {
                    return { success: false, error: 'Insufficient shares' };
                }

                const totalProceeds = trade.price * trade.quantity;
                const costBasis = position.avgPrice * trade.quantity;
                const pnl = totalProceeds - costBasis;

                position.quantity -= trade.quantity;
                position.currentPrice = trade.price;
                
                if (position.quantity === 0) {
                    portfolio.positions = portfolio.positions.filter(p => p.symbol !== trade.symbol);
                }

                portfolio.balance += totalProceeds;

                // Add PnL to trade record
                trade.pnl = pnl;
                trade.pnlPercent = (pnl / costBasis) * 100;
            }

            // Record transaction with enhanced data
            const transaction = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                ...trade,
                timestamp: new Date().toISOString(),
                balanceAfter: portfolio.balance,
                portfolioValue: this.calculateStats().totalValue
            };
            
            transactions.unshift(transaction);

            // Check for alerts
            this.checkPriceAlerts(trade.symbol, trade.price);

            saveAll();

            return { 
                success: true, 
                transaction,
                balance: portfolio.balance,
                positions: portfolio.positions,
                pnl: trade.pnl
            };
        },

        // Price alerts
        addPriceAlert: function(symbol, targetPrice, condition = 'above') {
            const alert = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                symbol,
                targetPrice,
                condition,
                created: new Date().toISOString(),
                triggered: false
            };
            alerts.push(alert);
            saveAll();
            return alert;
        },

        checkPriceAlerts: function(symbol, currentPrice) {
            alerts.filter(a => a.symbol === symbol && !a.triggered).forEach(alert => {
                let triggered = false;
                if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
                    triggered = true;
                } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
                    triggered = true;
                }

                if (triggered) {
                    alert.triggered = true;
                    alert.triggeredAt = new Date().toISOString();
                    
                    // Create notification
                    const notification = {
                        id: Date.now() + Math.random().toString(36).substr(2, 9),
                        type: 'price_alert',
                        message: `${symbol} ${alert.condition === 'above' ? 'reached' : 'fell to'} $${currentPrice.toFixed(2)}`,
                        timestamp: new Date().toISOString(),
                        read: false
                    };
                    
                    let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
                    notifications.unshift(notification);
                    localStorage.setItem('notifications', JSON.stringify(notifications));
                }
            });
            
            saveAll();
        },

        getAlerts: function() {
            return [...alerts];
        },

        deleteAlert: function(alertId) {
            alerts = alerts.filter(a => a.id !== alertId);
            saveAll();
        },

        // Portfolio analytics
        calculateStats: function() {
            return calculatePerformanceMetrics();
        },

        // Performance chart data
        getPerformanceHistory: function(days = 30) {
            const history = [];
            const today = new Date();
            
            // Group transactions by date
            const dailyValues = {};
            
            transactions.forEach(t => {
                const date = new Date(t.timestamp).toDateString();
                if (!dailyValues[date]) {
                    dailyValues[date] = {
                        date: date,
                        value: t.portfolioValue || 100000,
                        transactions: []
                    };
                }
                dailyValues[date].transactions.push(t);
            });

            // Create time series
            for (let i = days; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toDateString();
                
                if (dailyValues[dateStr]) {
                    history.push({
                        date: dateStr,
                        value: dailyValues[dateStr].value
                    });
                } else {
                    // Use previous value or initial
                    const prevValue = history.length > 0 ? history[history.length - 1].value : 100000;
                    history.push({
                        date: dateStr,
                        value: prevValue
                    });
                }
            }
            
            return history;
        },

        // Sector allocation
        getSectorAllocation: function() {
            const sectors = {};
            
            portfolio.positions.forEach(pos => {
                const sector = pos.sector || 'Other';
                const value = pos.quantity * (pos.currentPrice || pos.avgPrice);
                
                if (!sectors[sector]) {
                    sectors[sector] = 0;
                }
                sectors[sector] += value;
            });
            
            return sectors;
        },

        // Reset portfolio
        resetPortfolio: function() {
            portfolio = {
                positions: [],
                balance: 100000,
                initialBalance: 100000,
                lastUpdated: new Date().toISOString()
            };
            transactions = [];
            alerts = [];
            watchlist = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'JNJ', 'ADBE', 'CRM'];
            saveAll();
            return this.getPortfolio();
        },

        // Export all data
        exportAll: function() {
            const data = {
                portfolio,
                transactions,
                alerts,
                watchlist,
                stats: this.calculateStats(),
                exportDate: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `simulator-full-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        },

        // Import data
        importData: function(jsonData) {
            try {
                const data = JSON.parse(jsonData);
                if (data.portfolio) portfolio = data.portfolio;
                if (data.transactions) transactions = data.transactions;
                if (data.alerts) alerts = data.alerts;
                if (data.watchlist) watchlist = data.watchlist;
                saveAll();
                return true;
            } catch (error) {
                console.error('Error importing data:', error);
                return false;
            }
        },

        formatCurrency: function(value) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
        },

        formatPercent: function(value) {
            return new Intl.NumberFormat('en-US', {
                style: 'percent',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value / 100);
        },

        formatNumber: function(value) {
            return new Intl.NumberFormat('en-US').format(value);
        }
    };
})();

// Auto-initialize
SimulatorUtils.init();

// Make available globally
window.SimulatorUtils = SimulatorUtils;

console.log('✅ Advanced SimulatorUtils initialized');
