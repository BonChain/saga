/**
 * Animation Performance Monitor
 * Tracks frame rates and adjusts animation complexity based on device performance
 */

class AnimationPerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 60;
    this.isMonitoring = false;
    this.performanceProfile = 'auto'; // 'high', 'medium', 'low', 'auto'
    this.batteryLevel = null;
    this.callbacks = [];

    // Performance thresholds
    this.thresholds = {
      high: 50,    // FPS >= 50 = high performance
      medium: 30,  // FPS >= 30 = medium performance
      low: 15      // FPS < 30 = low performance
    };

    this.initBatteryMonitoring();
  }

  /**
   * Start monitoring animation performance
   */
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.measureFrame();
    console.log('🚀 Performance monitoring started');
  }

  /**
   * Stop monitoring animation performance
   */
  stopMonitoring() {
    this.isMonitoring = false;
    console.log('⏹️ Performance monitoring stopped');
  }

  /**
   * Measure frame rate and adjust performance profile
   */
  measureFrame() {
    if (!this.isMonitoring) return;

    this.frameCount++;
    const currentTime = performance.now();

    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round(this.frameCount);
      this.frameCount = 0;
      this.lastTime = currentTime;

      this.adjustPerformanceProfile();
      this.updateUI();
      this.notifyCallbacks();
    }

    requestAnimationFrame(() => this.measureFrame());
  }

  /**
   * Adjust performance profile based on current FPS
   */
  adjustPerformanceProfile() {
    if (this.performanceProfile !== 'auto') return;

    const previousProfile = this.getEffectiveProfile();

    if (this.fps >= this.thresholds.high) {
      this.performanceProfile = 'high';
    } else if (this.fps >= this.thresholds.medium) {
      this.performanceProfile = 'medium';
    } else {
      this.performanceProfile = 'low';
    }

    const newProfile = this.getEffectiveProfile();
    if (previousProfile !== newProfile) {
      console.log(`📊 Performance profile changed: ${previousProfile} → ${newProfile} (FPS: ${this.fps})`);
      this.applyPerformanceProfile(newProfile);
    }
  }

  /**
   * Get the effective performance profile (considering battery)
   */
  getEffectiveProfile() {
    let profile = this.performanceProfile;

    // Adjust for battery level if available
    if (this.batteryLevel !== null) {
      if (this.batteryLevel < 0.2) {
        profile = 'low';
        console.log('🔋 Low battery detected - forcing low performance mode');
      } else if (this.batteryLevel < 0.5 && profile === 'high') {
        profile = 'medium';
      }
    }

    return profile;
  }

  /**
   * Set performance profile manually
   */
  setPerformanceProfile(profile) {
    if (!['auto', 'high', 'medium', 'low'].includes(profile)) {
      console.warn(`Invalid performance profile: ${profile}`);
      return;
    }

    const previousProfile = this.getEffectiveProfile();
    this.performanceProfile = profile;
    const newProfile = this.getEffectiveProfile();

    if (previousProfile !== newProfile) {
      console.log(`⚙️ Performance profile set to: ${newProfile}`);
      this.applyPerformanceProfile(newProfile);
    }
  }

  /**
   * Apply performance profile to DOM
   */
  applyPerformanceProfile(profile) {
    document.body.setAttribute('data-performance', profile);

    // Add or remove performance classes
    document.body.classList.remove('performance-high', 'performance-medium', 'performance-low');
    document.body.classList.add(`performance-${profile}`);
  }

  /**
   * Update performance overlay if enabled
   */
  updateUI() {
    const overlay = document.getElementById('performance-overlay');
    if (overlay) {
      const profile = this.getEffectiveProfile();
      const batteryStatus = this.batteryLevel !== null ? ` | Battery: ${Math.round(this.batteryLevel * 100)}%` : '';

      overlay.innerHTML = `
        <div>FPS: ${this.fps}</div>
        <div>Profile: ${profile}</div>
        <div>Memory: ${this.getMemoryUsage()}${batteryStatus}</div>
      `;
    }
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage() {
    if (performance.memory) {
      const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
      const total = Math.round(performance.memory.totalJSHeapSize / 1048576);
      return `${used}/${total}MB`;
    }
    return 'N/A';
  }

  /**
   * Initialize battery monitoring if available
   */
  async initBatteryMonitoring() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        this.batteryLevel = battery.level;

        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level;
          console.log(`🔋 Battery level: ${Math.round(this.batteryLevel * 100)}%`);

          // Adjust performance based on battery
          if (this.performanceProfile === 'auto') {
            this.adjustPerformanceProfile();
          }
        });

        battery.addEventListener('chargingchange', () => {
          console.log(`🔌 Charging status: ${battery.charging ? 'charging' : 'discharging'}`);
        });

      } catch (error) {
        console.log('🔋 Battery API not available');
      }
    }
  }

  /**
   * Add callback for performance changes
   */
  onPerformanceChange(callback) {
    this.callbacks.push(callback);
  }

  /**
   * Notify all callbacks of performance changes
   */
  notifyCallbacks() {
    const profile = this.getEffectiveProfile();
    this.callbacks.forEach(callback => {
      try {
        callback({
          fps: this.fps,
          profile,
          batteryLevel: this.batteryLevel
        });
      } catch (error) {
        console.error('Performance callback error:', error);
      }
    });
  }

  /**
   * Get current performance stats
   */
  getStats() {
    return {
      fps: this.fps,
      profile: this.getEffectiveProfile(),
      batteryLevel: this.batteryLevel,
      isMonitoring: this.isMonitoring,
      memory: this.getMemoryUsage()
    };
  }

  /**
   * Enable or disable performance overlay
   */
  toggleOverlay(show) {
    let overlay = document.getElementById('performance-overlay');

    if (show && !overlay) {
      overlay = document.createElement('div');
      overlay.id = 'performance-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.9);
        color: #00ff41;
        padding: 10px;
        border: 1px solid #00ff41;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        pointer-events: none;
        border-radius: 4px;
        line-height: 1.4;
      `;
      document.body.appendChild(overlay);
    } else if (!show && overlay) {
      overlay.remove();
    }
  }
}

// Create singleton instance
const performanceMonitor = new AnimationPerformanceMonitor();

export default performanceMonitor;