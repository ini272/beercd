// Cooldown duration in hours (default: 1 hour)
let cooldownDuration = 1;
let cooldownEndTime = null;
let timerInterval = null;
let soundEnabled = false;
let notificationsEnabled = false;

// Load saved cooldown state from localStorage
function loadCooldownState() {
    const savedEndTime = localStorage.getItem('beercd_endTime');
    const savedDuration = localStorage.getItem('beercd_duration');
    const savedSoundEnabled = localStorage.getItem('beercd_soundEnabled');
    const savedNotificationsEnabled = localStorage.getItem('beercd_notificationsEnabled');
    
    if (savedDuration) {
        cooldownDuration = parseFloat(savedDuration);
        document.getElementById('cooldownHours').value = savedDuration;
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

// Update cooldown duration
function updateCooldownDuration() {
    const select = document.getElementById('cooldownHours');
    cooldownDuration = parseFloat(select.value);
    saveCooldownState();
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

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    loadCooldownState();
    updateSoundToggle();
});

