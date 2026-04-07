class DailyCheckIn {
    constructor() {
        // Event Configuration
        this.eventStartTime = new Date('2026-01-20T00:00:00').getTime();
        this.eventEndTime = new Date('2026-02-05T23:59:59').getTime();

        // Rewards Configuration
        this.rewards = [
            { day: 1, icon: '🎁', name: 'Hộp quà', isMilestone: false },
            { day: 2, icon: '💝', name: 'Gói quà tặng', isMilestone: false },
            { day: 3, icon: '👑', name: 'Hộp quà Premium', isMilestone: true },
            { day: 4, icon: '🎀', name: 'Quà lụa', isMilestone: false },
            { day: 5, icon: '💎', name: 'Viên ngọc', isMilestone: false },
            { day: 6, icon: '🌟', name: 'Sao vàng', isMilestone: false },
            { day: 7, icon: '🏆', name: 'Huy chương', isMilestone: true },
            { day: 8, icon: '🎊', name: 'Pháo hoa', isMilestone: false },
            { day: 9, icon: '💰', name: 'Tiền thưởng', isMilestone: false },
            { day: 10, icon: '🏅', name: 'Bonus cuối cùng', isMilestone: true }
        ];

        // State
        this.claimedDays = [];
        this.currentStreak = 0;
        this.inventory = [];
        this.lastClaimDate = null;
        this.soundEnabled = true;
        this.lastAction = null;

        this.init();
    }

    init() {
        console.log('🎮 Game initializing...');
        this.loadState();
        console.log('✅ State loaded:', {
            claimedDays: this.claimedDays,
            streak: this.currentStreak,
            inventory: this.inventory.length
        });
        this.setupEventListeners();
        console.log('✅ Event listeners setup');
        this.renderGrid();
        console.log('✅ Grid rendered');
        this.updateUI();
        console.log('✅ UI updated');
        this.startCountdown();
        console.log('✅ Countdown started');
        console.log('🎮 Game ready! Event status:', this.getEventStatus());
        // Run quick diagnostics to detect missing elements or modal issues
        try {
            this.runDiagnostics();
        } catch (e) {
            console.error('Diagnostics failed:', e);
        }
    }

    // Quick runtime diagnostics to surface missing DOM elements or modal issues
    runDiagnostics() {
        const requiredIds = [
            'soundBtn','rulesBtn','inventoryBtn','exitBtn',
            'checkInGrid','todayRewardModal','inventoryModal','claimBtn','inventoryContainer'
        ];
        const errors = [];

        requiredIds.forEach(id => {
            if (!document.getElementById(id)) {
                errors.push(`Missing element: ${id}`);
            }
        });

        // Quick modal open/close smoke test (non-visual)
        ['rulesModal','todayRewardModal','inventoryModal'].forEach(mid => {
            const m = document.getElementById(mid);
            if (!m) {
                errors.push(`Missing modal: ${mid}`);
                return;
            }
            // try toggling hidden class to ensure CSS rules apply
            m.classList.remove('hidden');
            m.classList.add('hidden');
        });

        if (errors.length) {
            this.showDebugBanner(errors, false);
            console.warn('UI Diagnostics found issues:', errors);
        } else {
            this.showDebugBanner(['All UI checks passed'], true);
            console.log('UI Diagnostics: all checks passed');
        }
    }

    showDebugBanner(messages, ok = false) {
        // remove existing
        const existing = document.getElementById('debugBanner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.id = 'debugBanner';
        banner.style.position = 'fixed';
        banner.style.left = '12px';
        banner.style.right = '12px';
        banner.style.top = '12px';
        banner.style.zIndex = 99999;
        banner.style.padding = '10px 12px';
        banner.style.borderRadius = '8px';
        banner.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
        banner.style.fontSize = '13px';
        banner.style.maxHeight = '50vh';
        banner.style.overflow = 'auto';
        banner.style.display = 'flex';
        banner.style.flexDirection = 'column';
        banner.style.gap = '6px';
        banner.style.alignItems = 'flex-start';
        banner.style.background = ok ? '#e8f5e9' : '#fff3cd';
        banner.style.color = '#222';

        messages.forEach(m => {
            const row = document.createElement('div');
            row.textContent = (ok ? '✅ ' : '❗ ') + m;
            banner.appendChild(row);
        });

        // Add a small close button
        const close = document.createElement('button');
        close.textContent = '×';
        close.style.position = 'absolute';
        close.style.top = '6px';
        close.style.right = '8px';
        close.style.border = 'none';
        close.style.background = 'transparent';
        close.style.fontSize = '16px';
        close.style.cursor = 'pointer';
        close.addEventListener('click', () => banner.remove());
        banner.appendChild(close);

        document.body.appendChild(banner);
    }

    // ===== TIME & STATE MANAGEMENT =====
    getTodayDate() {
        return new Date().toDateString();
    }

    getCurrentTime() {
        return Date.now();
    }

    getEventStatus() {
        const now = this.getCurrentTime();
        if (now < this.eventStartTime) return 'before';
        if (now > this.eventEndTime) return 'ended';
        return 'active';
    }

    getTimeRemaining(endTime) {
        const now = this.getCurrentTime();
        const diff = Math.max(0, endTime - now);
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        return { hours, minutes, seconds, total: diff };
    }

    formatTime(hours, minutes, seconds) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // ===== STREAK MANAGEMENT =====
    updateStreak() {
        const today = this.getTodayDate();
        const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toDateString();

        if (this.lastClaimDate === today) {
            // Already claimed today
            return;
        }

        if (this.lastClaimDate === yesterday) {
            // Continue streak
            this.currentStreak++;
        } else {
            // Reset streak (day missed)
            this.currentStreak = 1;
        }
    }

    // ===== REWARD LOGIC =====
    getCurrentDay() {
        if (this.claimedDays.length === 0) return 1;
        return Math.min(Math.max(...this.claimedDays) + 1, 10);
    }

    getReward(day) {
        return this.rewards[day - 1] || this.rewards[0];
    }

    claimReward() {
        console.log('🎯 Claim button clicked');
        if (this.lastClaimDate === this.getTodayDate()) {
            // Already claimed today
            console.log('⚠️ Already claimed today');
            this.showModal('alreadyClaimedModal');
            return;
        }

        const currentDay = this.getCurrentDay();
        if (currentDay > 10) {
            console.log('❌ Event completed');
            this.showError('Sự kiện đã kết thúc', 'Bạn đã hoàn thành tất cả 10 ngày!');
            return;
        }

        // Disable button to prevent double-tap
        const claimBtn = document.getElementById('claimBtn');
        claimBtn.disabled = true;
        claimBtn.textContent = '⏳ Đang xử lý...';

        // Simulate server delay
        setTimeout(() => {
            try {
                this.updateStreak();

                if (!this.claimedDays.includes(currentDay)) {
                    this.claimedDays.push(currentDay);
                }

                const reward = this.getReward(currentDay);
                this.inventory.push({
                    day: currentDay,
                    icon: reward.icon,
                    name: reward.name,
                    timestamp: new Date().toLocaleString('vi-VN')
                });

                this.lastClaimDate = this.getTodayDate();
                this.saveState();
                this.playSound();

                // Update UI
                this.renderGrid();
                this.updateUI();
                this.closeModal('todayRewardModal');
                this.showConfirmation(reward);

                console.log('✅ Reward claimed:', reward.name);

                // Analytics tracking
                this.trackEvent('claim_success', {
                    day: currentDay,
                    streak: this.currentStreak,
                    is_milestone: reward.isMilestone
                });
            } catch (error) {
                console.error('❌ Error claiming reward:', error);
                this.showError('Lỗi nhận quà', 'Đã xảy ra lỗi. Vui lòng thử lại.');
                this.trackEvent('claim_failed', { error: error.message });
            } finally {
                claimBtn.disabled = false;
                claimBtn.textContent = 'Nhận quà';
            }
        }, 500);
    }

    // ===== UI RENDERING =====
    renderGrid() {
        const grid = document.getElementById('checkInGrid');
        grid.innerHTML = '';

        const currentDay = this.getCurrentDay();

        for (let i = 1; i <= 10; i++) {
            const dayBox = document.createElement('div');
            dayBox.className = 'day-box';
            dayBox.id = `day-${i}`;

            const reward = this.getReward(i);
            dayBox.innerHTML = `<span>${reward.icon}</span><span class="day-label">Ngày ${i}</span>`;

            // Apply state classes
            if (i < currentDay) {
                dayBox.classList.add('claimed');
            } else if (i === currentDay) {
                dayBox.classList.add('today');
                dayBox.style.cursor = 'pointer';
            } else {
                dayBox.classList.add('locked');
                dayBox.style.cursor = 'not-allowed';
            }

            if (reward.isMilestone && !dayBox.classList.contains('locked')) {
                dayBox.classList.add('milestone');
            }

            dayBox.addEventListener('click', () => this.handleDayClick(i));
            grid.appendChild(dayBox);
        }
    }

    handleDayClick(day) {
        console.log('🖱️ Day clicked:', day);
        const currentDay = this.getCurrentDay();

        if (day < currentDay) {
            // Already claimed
            console.log('📋 Showing already claimed modal for day', day);
            this.showAlreadyClaimed(day);
        } else if (day === currentDay) {
            // Today - show reward modal
            console.log('🎁 Showing today reward modal for day', day);
            this.showTodayReward(day);
        } else {
            // Future day - locked
            console.log('🔒 Showing locked modal for day', day);
            this.showLockedDay(day);
        }

        this.trackEvent('tile_clicked', { day, state: day < currentDay ? 'claimed' : day === currentDay ? 'today' : 'locked' });
    }

    showTodayReward(day) {
        const reward = this.getReward(day);

        document.getElementById('todayRewardIcon').textContent = reward.icon;
        document.getElementById('todayRewardName').textContent = reward.name;
        document.getElementById('modalDayNumber').textContent = day;
        document.getElementById('modalStreakDays').textContent = this.currentStreak;

        const remainingDays = 10 - day;
        const hint = remainingDays === 0 
            ? '🎉 Đây là ngày cuối cùng! Hãy nhận quà bonus.' 
            : `📅 Còn ${remainingDays} ngày nữa để hoàn thành sự kiện.`;
        document.getElementById('rewardHint').textContent = hint;

        this.openModal('todayRewardModal');
        this.trackEvent('reward_viewed', { day, reward_name: reward.name });
    }

    showAlreadyClaimed(day) {
        const reward = this.getReward(day);
        document.getElementById('claimedText').textContent = `Bạn đã nhận quà "${reward.name}" từ Kho của bạn.`;
        this.openModal('alreadyClaimedModal');
    }

    showLockedDay(day) {
        const reward = this.getReward(day);
        const currentDay = this.getCurrentDay();
        const daysUntil = day - currentDay;

        document.getElementById('lockedText').textContent = 
            daysUntil === 1 
                ? 'Quay lại ngày mai để nhận quà này.' 
                : `Quay lại sau ${daysUntil} ngày để nhận quà này.`;

        document.getElementById('lockedRewardIcon').textContent = reward.icon;
        document.getElementById('lockedRewardName').textContent = reward.name;

        this.openModal('lockedModal');
    }

    showConfirmation(reward) {
        document.getElementById('confirmRewardName').textContent = reward.name;
        document.getElementById('confirmStreakDays').textContent = this.currentStreak;

        const remaining = 10 - this.getCurrentDay() + 1;
        const remainingText = remaining > 0 
            ? `Còn ${remaining} quà để nhận` 
            : '🎉 Bạn đã hoàn thành sự kiện!';
        document.getElementById('confirmRemaining').textContent = remainingText;

        this.openModal('confirmationModal');
    }

    showError(title, message) {
        document.getElementById('errorTitle').textContent = title;
        document.getElementById('errorMessage').textContent = message;
        this.openModal('errorModal');
    }

    updateUI() {
        document.getElementById('streakCount').textContent = this.currentStreak;
        document.getElementById('inventoryCount').textContent = this.inventory.length;
        document.getElementById('totalClaimed').textContent = this.claimedDays.length;

        // Update event state visibility
        const status = this.getEventStatus();
        document.getElementById('beforeEventState').classList.toggle('hidden', status !== 'before');
        document.getElementById('activeEventState').classList.toggle('hidden', status !== 'active');
        document.getElementById('endedEventState').classList.toggle('hidden', status !== 'ended');
    }

    startCountdown() {
        const updateCountdown = () => {
            const status = this.getEventStatus();

            if (status === 'before') {
                const remaining = this.getTimeRemaining(this.eventStartTime);
                const timeStr = this.formatTime(remaining.hours, remaining.minutes, remaining.seconds);
                document.getElementById('countdownBefore').textContent = 
                    `${String(remaining.hours).padStart(2, '0')}:${String(remaining.minutes).padStart(2, '0')}:${String(remaining.seconds).padStart(2, '0')}`;
            } else if (status === 'active') {
                const remaining = this.getTimeRemaining(this.eventEndTime);
                const timeStr = this.formatTime(remaining.hours, remaining.minutes, remaining.seconds);
                document.getElementById('countdownActive').textContent = timeStr;
            }
        };

        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    openInventory() {
        console.log('📦 Opening inventory...');
        const container = document.getElementById('inventoryContainer');
        
        if (!container) {
            console.error('❌ Inventory container not found!');
            return;
        }

        console.log('📊 Inventory items:', this.inventory.length);

        if (this.inventory.length === 0) {
            container.innerHTML = '<div class="inventory-empty">📭 Kho quà của bạn còn trống</div>';
        } else {
            const listHTML = this.inventory.map((item, index) => `
                <div class="inventory-item">
                    <div class="inventory-item-icon">${item.icon}</div>
                    <div class="inventory-item-info">
                        <div class="inventory-item-name">${item.name}</div>
                        <div class="inventory-item-time">Ngày ${item.day} • ${item.timestamp}</div>
                    </div>
                </div>
            `).join('');
            container.innerHTML = `<div class="inventory-list">${listHTML}</div>`;
        }

        console.log('✅ Inventory rendered');
        this.openModal('inventoryModal');
        this.trackEvent('inventory_opened', { item_count: this.inventory.length });
    }

    // ===== MODAL MANAGEMENT =====
    openModal(modalId) {
        console.log('🪟 Opening modal:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            console.log('✅ Modal opened:', modalId);
        } else {
            console.error('❌ Modal not found:', modalId);
        }
    }

    closeModal(modalId) {
        console.log('🪟 Closing modal:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showModal(modalId) {
        this.openModal(modalId);
    }

    // ===== SOUND & EFFECTS =====
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        document.getElementById('soundBtn').textContent = this.soundEnabled ? '🔊' : '🔇';
        localStorage.setItem('soundEnabled', JSON.stringify(this.soundEnabled));
    }

    playSound() {
        if (!this.soundEnabled) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // Audio context not supported
        }
    }

    // ===== STATE MANAGEMENT =====
    saveState() {
        const state = {
            claimedDays: this.claimedDays,
            currentStreak: this.currentStreak,
            inventory: this.inventory,
            lastClaimDate: this.lastClaimDate,
            soundEnabled: this.soundEnabled
        };
        localStorage.setItem('dailyCheckInState', JSON.stringify(state));
    }

    loadState() {
        const stored = localStorage.getItem('dailyCheckInState');
        if (stored) {
            try {
                const state = JSON.parse(stored);
                this.claimedDays = state.claimedDays || [];
                this.currentStreak = state.currentStreak || 0;
                this.inventory = state.inventory || [];
                this.lastClaimDate = state.lastClaimDate || null;
                this.soundEnabled = state.soundEnabled !== false;
            } catch (e) {
                console.error('Failed to load state', e);
            }
        }
        
        // Update button
        document.getElementById('soundBtn').textContent = this.soundEnabled ? '🔊' : '🔇';
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        const soundBtn = document.getElementById('soundBtn');
        const rulesBtn = document.getElementById('rulesBtn');
        const inventoryBtn = document.getElementById('inventoryBtn');
        const exitBtn = document.getElementById('exitBtn');
        
        if (!soundBtn) console.error('❌ soundBtn not found');
        if (!rulesBtn) console.error('❌ rulesBtn not found');
        if (!inventoryBtn) console.error('❌ inventoryBtn not found');
        if (!exitBtn) console.error('❌ exitBtn not found');
        
        soundBtn.addEventListener('click', () => {
            console.log('🔊 Sound button clicked');
            this.toggleSound();
        });
        rulesBtn.addEventListener('click', () => {
            console.log('📋 Rules button clicked');
            this.openModal('rulesModal');
            this.trackEvent('rules_opened');
        });
        inventoryBtn.addEventListener('click', () => {
            console.log('🎁 Inventory button clicked');
            this.openInventory();
        });
        exitBtn.addEventListener('click', () => {
            console.log('❌ Exit button clicked');
            window.close();
        });

        // Close modals when clicking overlay
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                // Get the parent modal
                const modal = overlay.closest('.modal');
                if (modal) {
                    const modalId = modal.id;
                    console.log('🪟 Closing modal from overlay:', modalId);
                    this.closeModal(modalId);
                }
            });
        });
        
        console.log('✅ Event listeners setup complete');
    }

    // ===== UTILITY =====
    setReminder() {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('Điểm danh 10 ngày', {
                    body: 'Nhắc nhở: Quay lại nhận quà hôm nay!',
                    icon: '🎁'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
        this.trackEvent('reminder_set');
    }

    retryLastAction() {
        this.closeModal('errorModal');
        if (this.lastAction === 'claim') {
            this.claimReward();
        }
    }

    closeEvent() {
        // Just close any open modal
        document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    // ===== ANALYTICS =====
    trackEvent(eventName, params = {}) {
        // Placeholder for analytics tracking
        const eventData = {
            timestamp: new Date().toISOString(),
            eventName,
            eventStatus: this.getEventStatus(),
            userProgress: {
                claimedDays: this.claimedDays.length,
                currentStreak: this.currentStreak,
                inventorySize: this.inventory.length
            },
            ...params
        };

        // Send to analytics service in production
        console.log('📊 Analytics:', eventData);

        // Could send to backend:
        // fetch('/api/analytics', { method: 'POST', body: JSON.stringify(eventData) })
    }
}

// Initialize game
const game = new DailyCheckIn();
