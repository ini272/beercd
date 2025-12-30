// Cooldown duration in hours (default: 1 hour)
let cooldownDuration = 1;
let cooldownEndTime = null;
let timerInterval = null;
let soundEnabled = false;
let notificationsEnabled = false;

// Custom duration spinner state
let customHours = 1;
let customMinutes = 0;

// Load saved cooldown state from localStorage
function loadCooldownState() {
    const savedEndTime = localStorage.getItem('beercd_endTime');
    const savedDuration = localStorage.getItem('beercd_duration');
    const savedSoundEnabled = localStorage.getItem('beercd_soundEnabled');
    const savedNotificationsEnabled = localStorage.getItem('beercd_notificationsEnabled');
    
    if (savedDuration) {
        cooldownDuration = parseFloat(savedDuration);
    }
    
    if (savedSoundEnabled !== null) {
        soundEnabled = savedSoundEnabled === 'true';
        updateSoundToggle();
    }
    
    if (savedNotificationsEnabled !== null) {
        notificationsEnabled = savedNotificationsEnabled === 'true';
    }
    
    // Check if we have notification permission
    if ('Notification' in window && Notification.permission === 'granted') {
        notificationsEnabled = true;
    }
    
    if (savedEndTime) {
        cooldownEndTime = parseInt(savedEndTime);
        const now = Date.now();
        
        if (cooldownEndTime > now) {
            // Cooldown is still active
            startTimer();
            // Check if timer expired while app was closed
            checkExpiredTimer();
        } else {
            // Cooldown has expired
            clearCooldown();
        }
    }
    
    updateDisplay();
}

// Save cooldown state to localStorage
function saveCooldownState() {
    if (cooldownEndTime) {
        localStorage.setItem('beercd_endTime', cooldownEndTime.toString());
    } else {
        localStorage.removeItem('beercd_endTime');
    }
    localStorage.setItem('beercd_duration', cooldownDuration.toString());
    localStorage.setItem('beercd_soundEnabled', soundEnabled.toString());
    localStorage.setItem('beercd_notificationsEnabled', notificationsEnabled.toString());
}

// Play beer sound effect
function playBeerSound() {
    if (!soundEnabled) return;
    
    const audio = document.getElementById('beerSound');
    if (audio) {
        // Set volume to 25% to make it less loud (some MP3s are mastered very loud)
        audio.volume = 0.25;
        // Reset to beginning in case it's already playing
        audio.currentTime = 0;
        audio.play().catch(err => {
            // Silently fail if audio can't play (e.g., no sound file or autoplay restrictions)
            console.log('Audio play failed (this is okay if no sound file is provided):', err);
        });
    }
}

// Toggle sound on/off
function toggleSound() {
    soundEnabled = !soundEnabled;
    saveCooldownState();
    updateSoundToggle();
}

// Update sound toggle button appearance
function updateSoundToggle() {
    const soundIcon = document.getElementById('soundIcon');
    const soundToggle = document.getElementById('soundToggle');
    if (soundIcon && soundToggle) {
        soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
        soundToggle.classList.toggle('muted', !soundEnabled);
    }
}

// Show bubbly beer animation
function showBeerAnimation() {
    const overlay = document.getElementById('beerAnimation');
    if (!overlay) return;
    
    // Create bubbles
    const bubblesContainer = overlay.querySelector('.bubbles-container');
    bubblesContainer.innerHTML = ''; // Clear existing bubbles
    
    // Generate random bubbles
    for (let i = 0; i < 30; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.style.left = Math.random() * 100 + '%';
        bubble.style.animationDelay = Math.random() * 2 + 's';
        bubble.style.animationDuration = (Math.random() * 2 + 2) + 's';
        bubble.style.width = bubble.style.height = (Math.random() * 15 + 5) + 'px';
        bubblesContainer.appendChild(bubble);
    }
    
    // Show overlay
    overlay.classList.add('active');
    
    // Hide after animation completes
    setTimeout(() => {
        overlay.classList.remove('active');
    }, 3000); // 3 seconds
}

// Request notification permission
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        notificationsEnabled = true;
        return true;
    }
    
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            notificationsEnabled = true;
            saveCooldownState();
            return true;
        }
    }
    
    return false;
}

// Show notification when timer expires
function showTimerNotification() {
    if (!notificationsEnabled || !('Notification' in window)) {
        return;
    }
    
    if (Notification.permission === 'granted') {
        const notification = new Notification('🍺 BeerCD - Cooldown Complete!', {
            body: 'Your cooldown timer has finished.',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            tag: 'beercd-cooldown-complete',
            requireInteraction: false
        });
        
        // Close notification after 5 seconds
        setTimeout(() => {
            notification.close();
        }, 5000);
        
        // Focus app when notification is clicked
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}

// Check if timer expired while app was closed
function checkExpiredTimer() {
    if (!cooldownEndTime) return;
    
    const now = Date.now();
    if (cooldownEndTime <= now && notificationsEnabled) {
        // Timer expired while app was closed - show notification
        showTimerNotification();
    }
}

// Start the cooldown
async function startCooldown() {
    // Always reset/start a new cooldown when button is clicked
    if (cooldownEndTime) {
        clearCooldown();
    }
    
    // Request notification permission if not already granted
    await requestNotificationPermission();
    
    // Play sound and show animation
    playBeerSound();
    showBeerAnimation();
    
    const now = Date.now();
    cooldownEndTime = now + (cooldownDuration * 60 * 60 * 1000);
    
    saveCooldownState();
    startTimer();
    updateDisplay();
    
    // Visual feedback
    document.querySelector('.timer-display').classList.add('cooldown-active');
    
    // Show stop button
    const stopButton = document.getElementById('stopButton');
    if (stopButton) {
        stopButton.style.display = 'flex';
    }
    
    // Schedule notification via service worker
    scheduleNotification();
}

// Stop the cooldown (called by stop button)
function stopCooldown() {
    clearCooldown();
}

// Clear the cooldown
function clearCooldown() {
    cooldownEndTime = null;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    localStorage.removeItem('beercd_endTime');
    updateDisplay();
    
    document.querySelector('.timer-display').classList.remove('cooldown-active');
    
    // Hide stop button
    const stopButton = document.getElementById('stopButton');
    if (stopButton) {
        stopButton.style.display = 'none';
    }
}

// Schedule notification in service worker
function scheduleNotification() {
    if (!notificationsEnabled || !('serviceWorker' in navigator)) {
        return;
    }
    
    // Send message to service worker with timer end time
    navigator.serviceWorker.ready.then(registration => {
        registration.active.postMessage({
            type: 'SCHEDULE_NOTIFICATION',
            endTime: cooldownEndTime
        });
    });
}

// Start the timer
function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(() => {
        updateDisplay();
        
        const now = Date.now();
        if (cooldownEndTime <= now) {
            // Cooldown expired
            showTimerNotification();
            clearCooldown();
            // Don't show alert if notification was shown
            if (!notificationsEnabled) {
                alert('Cooldown complete! 🍺');
            }
        }
    }, 1000);
    
    updateDisplay();
}

// Update the display
function updateDisplay() {
    const timeDisplay = document.getElementById('timeDisplay');
    const statusDisplay = document.getElementById('statusDisplay');
    const refreshIcon = document.getElementById('refreshIcon');
    const stopButton = document.getElementById('stopButton');
    
    if (!cooldownEndTime) {
        timeDisplay.textContent = '--:--:--';
        statusDisplay.textContent = 'Ready';
        if (refreshIcon) {
            refreshIcon.style.display = 'none';
        }
        if (stopButton) {
            stopButton.style.display = 'none';
        }
        return;
    }
    
    const now = Date.now();
    const remaining = Math.max(0, cooldownEndTime - now);
    
    if (remaining === 0) {
        timeDisplay.textContent = '00:00:00';
        statusDisplay.textContent = 'Cooldown Complete!';
        if (refreshIcon) {
            refreshIcon.style.display = 'none';
        }
        if (stopButton) {
            stopButton.style.display = 'none';
        }
        return;
    }
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    timeDisplay.textContent = 
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0');
    
    statusDisplay.textContent = 'Cooldown Active';
    
    if (refreshIcon) {
        refreshIcon.style.display = 'flex';
    }
    if (stopButton) {
        stopButton.style.display = 'flex';
    }
}

// Toggle custom duration section
function toggleCustomDuration() {
    const section = document.getElementById('customSection');
    const toggle = document.getElementById('customToggle');
    const icon = document.getElementById('toggleIcon');
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        icon.textContent = '▲';
    } else {
        section.style.display = 'none';
        icon.textContent = '▼';
    }
}

// Set preset duration and update UI
function setPresetDuration(hours) {
    cooldownDuration = hours;
    saveCooldownState();
    updatePresetButtonsUI();
    updateCustomSpinnerDisplay();
}

// Update custom spinner display
function updateCustomSpinnerDisplay() {
    const hourDisplay = document.getElementById('hourDisplay');
    const minuteDisplay = document.getElementById('minuteDisplay');
    
    if (hourDisplay) {
        hourDisplay.textContent = customHours;
    }
    
    if (minuteDisplay) {
        minuteDisplay.textContent = String(customMinutes).padStart(2, '0');
    }
    
    updateLivePreview();
}

// Update live preview text
function updateLivePreview() {
    const totalMinutes = customHours * 60 + customMinutes;
    const displayHours = Math.floor(totalMinutes / 60);
    const displayMinutes = totalMinutes % 60;
    
    let preview = '';
    if (displayHours > 0) {
        preview += displayHours + 'h';
    }
    if (displayMinutes > 0 || preview === '') {
        if (preview) preview += ' ';
        preview += displayMinutes + 'm';
    }
    
    document.getElementById('livePreview').textContent = preview;
}

// Increment hour
function incrementHour() {
    if (customHours < 23) {
        customHours++;
        updateCustomSpinnerDisplay();
    }
}

// Decrement hour
function decrementHour() {
    if (customHours > 0) {
        customHours--;
        updateCustomSpinnerDisplay();
    }
}

// Increment minute (wraps at 60)
function incrementMinute() {
    customMinutes = (customMinutes + 5) % 60;
    updateCustomSpinnerDisplay();
}

// Decrement minute (wraps at 0)
function decrementMinute() {
    customMinutes = (customMinutes - 5 + 60) % 60;
    updateCustomSpinnerDisplay();
}

// Apply custom duration
function applyCustomDuration() {
    const totalMinutes = customHours * 60 + customMinutes;
    
    // Validate: minimum 1 minute
    if (totalMinutes < 1) {
        alert('Please set a duration of at least 1 minute');
        return;
    }
    
    cooldownDuration = totalMinutes / 60; // Convert back to hours
    saveCooldownState();
    updatePresetButtonsUI();
    
    // Visual feedback
    const btn = document.querySelector('.apply-custom-btn');
    if (btn) {
        btn.textContent = 'Applied!';
        btn.style.backgroundColor = '#6b8e23';
        setTimeout(() => {
            btn.textContent = 'Apply';
            btn.style.backgroundColor = '';
        }, 1500);
    }
}

// Reset custom duration to current cooldownDuration
function resetCustomDuration() {
    customHours = Math.floor(cooldownDuration);
    customMinutes = Math.round((cooldownDuration - customHours) * 60);
    updateCustomSpinnerDisplay();
}

// Update preset button UI to show which is active
function updatePresetButtonsUI() {
    const presets = [
        { value: 0.5, hours: 0, minutes: 30 },
        { value: 1, hours: 1, minutes: 0 },
        { value: 1.5, hours: 1, minutes: 30 },
        { value: 2, hours: 2, minutes: 0 },
        { value: 3, hours: 3, minutes: 0 }
    ];
    
    const buttons = document.querySelectorAll('.preset-btn');
    buttons.forEach((btn, idx) => {
        const preset = presets[idx];
        const match = Math.abs(cooldownDuration - preset.value) < 0.01;
        btn.classList.toggle('active', match);
    });
}

// Handle visibility changes (app backgrounded/foregrounded)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && cooldownEndTime) {
        // App became visible - update display immediately
        updateDisplay();
        
        // Check if cooldown expired while in background
        const now = Date.now();
        if (cooldownEndTime <= now) {
            if (notificationsEnabled) {
                showTimerNotification();
            } else {
                alert('Cooldown complete! 🍺');
            }
            clearCooldown();
        } else if (!timerInterval) {
            // Restart timer if it was stopped
            startTimer();
        }
    }
});

// Handle page focus/blur for additional reliability
window.addEventListener('focus', () => {
    if (cooldownEndTime) {
        updateDisplay();
        const now = Date.now();
        if (cooldownEndTime <= now) {
            if (notificationsEnabled) {
                showTimerNotification();
            } else {
                alert('Cooldown complete! 🍺');
            }
            clearCooldown();
        } else if (!timerInterval) {
            startTimer();
        }
    }
    // Check if timer expired while app was closed
    checkExpiredTimer();
});

// Touch/swipe support for spinners
let touchStartY = 0;
let touchStartValue = 0;
let spinnerType = null; // 'hours' or 'minutes'

function initSpinnerTouch() {
    const hourDisplay = document.getElementById('hourDisplay');
    const minuteDisplay = document.getElementById('minuteDisplay');
    
    if (hourDisplay) {
        hourDisplay.addEventListener('touchstart', (e) => handleSpinnerTouchStart(e, 'hours'), false);
        hourDisplay.addEventListener('touchmove', (e) => handleSpinnerTouchMove(e), false);
        hourDisplay.addEventListener('touchend', (e) => handleSpinnerTouchEnd(e), false);
    }
    
    if (minuteDisplay) {
        minuteDisplay.addEventListener('touchstart', (e) => handleSpinnerTouchStart(e, 'minutes'), false);
        minuteDisplay.addEventListener('touchmove', (e) => handleSpinnerTouchMove(e), false);
        minuteDisplay.addEventListener('touchend', (e) => handleSpinnerTouchEnd(e), false);
    }
}

function handleSpinnerTouchStart(e, type) {
    touchStartY = e.touches[0].clientY;
    spinnerType = type;
    touchStartValue = type === 'hours' ? customHours : customMinutes;
}

function handleSpinnerTouchMove(e) {
    if (!spinnerType) return;
    
    const currentY = e.touches[0].clientY;
    const diff = touchStartY - currentY; // Negative = swipe down, Positive = swipe up
    const threshold = 15; // Pixels to move before registering
    
    if (Math.abs(diff) > threshold) {
        e.preventDefault();
    }
}

function handleSpinnerTouchEnd(e) {
    if (!spinnerType) return;
    
    const currentY = e.changedTouches[0].clientY;
    const diff = touchStartY - currentY;
    const increment = Math.round(diff / 30); // Every 30px = 1 increment
    
    if (spinnerType === 'hours') {
        customHours = Math.max(0, Math.min(23, touchStartValue + increment));
    } else if (spinnerType === 'minutes') {
        customMinutes = Math.max(0, Math.min(59, touchStartValue + Math.round(increment * 5)));
    }
    
    updateCustomSpinnerDisplay();
    spinnerType = null;
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    loadCooldownState();
    updateSoundToggle();
    updateCustomSpinnerDisplay();
    updatePresetButtonsUI();
    initSpinnerTouch();
});

