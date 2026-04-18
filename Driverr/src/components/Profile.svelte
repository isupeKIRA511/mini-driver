<script lang="ts">
  import { driverProfile, isAuthenticated, currentView, fetchProfile } from '../stores/appStore';
  import { onMount } from 'svelte';

  onMount(() => {
    if ($isAuthenticated) {
      fetchProfile();
    }
  });
</script>

<div class="profile-container animate-fade container">
  {#if !$driverProfile}
    <div style="display:flex; justify-content:center; align-items:center; height:100%;">
      <p style="color:var(--text-muted);">جاري تحميل الملف الشخصي...</p>
    </div>
  {:else}
    <!-- Driver Header Details -->
    <div class="profile-header card">
      <div class="avatar-section">
        <div class="avatar-fallback" style="width: 80px; height: 80px; border-radius: 50%; background: var(--bg-tertiary); display:flex; align-items:center; justify-content:center; font-size: 2rem; font-weight: 700; color:var(--text-secondary); border: 3px solid var(--bg-primary); box-shadow: var(--box-shadow);">
          {$driverProfile.name ? $driverProfile.name.charAt(0) : 'م'}
        </div>
        <div class="verified-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--success)" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
      </div>
      
      <div class="driver-info">
        <h2 class="driver-name">{$driverProfile.name || 'سائق'}</h2>
        <p class="driver-phone" dir="ltr" style="text-align: right;">{$driverProfile.phoneNumber || ''}</p>
        <div class="trust-badge">سائق موثق</div>
      </div>
      <button class="logout-mini" on:click={() => { $isAuthenticated = false; $currentView = 'auth'; }} title="تسجيل الخروج">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
      </button>
    </div>

    <!-- Performance & Comfort Score -->
    <div class="score-card card">
      <h3>مستوى الراحة</h3>
      <div class="score-display">
        <div class="score-circle">
          <svg viewBox="0 0 36 36" class="circular-chart">
            <path class="circle-bg"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path class="circle"
              stroke-dasharray="{((($driverProfile.comfortScore || 5) / 5) * 100)}, 100"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div class="score-number">
            <span class="value">{($driverProfile.comfortScore || 5).toFixed(1)}</span>
            <span class="total">/ 5.0</span>
          </div>
        </div>
        <div class="score-details">
          <div class="stars">
            {#each Array(5) as _, i}
              <svg width="20" height="20" viewBox="0 0 24 24" fill={i < Math.floor($driverProfile.comfortScore || 5) ? 'var(--warning)' : 'var(--bg-tertiary)'} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            {/each}
          </div>
          <p class="score-label">سائق بتقييم عالي</p>
        </div>
      </div>
    </div>

    <!-- Vehicle Information -->
    <div class="vehicle-card card">
      <h3>معلومات السيارة</h3>
      
      <div class="vehicle-details">
        <div class="vehicle-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11V8.5A1.5 1.5 0 0014.5 7h-7A1.5 1.5 0 006 8.5V11l-5.16.86a1 1 0 00-.84.99V16h3m14 0v1.5a1.5 1.5 0 01-1.5 1.5h-1A1.5 1.5 0 0118 17.5V16m-14 0v1.5A1.5 1.5 0 012.5 19h-1A1.5 1.5 0 010 17.5V16m8-9V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </div>
        <div class="vehicle-text">
          <h4>{$driverProfile.carBrand || 'غير محدد'}</h4>
          <p>{$driverProfile.carModel || ''}</p>
        </div>
      </div>
      
      <div class="license-plate-wrapper">
        <div class="license-plate">
          <div class="plate-header" style="font-family: inherit;">العراق - البصرة</div>
          <div class="plate-number">{$driverProfile.carLicensePlate || '---'}</div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .profile-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    background: linear-gradient(145deg, var(--bg-secondary) 0%, rgba(200,200,200,0.1) 100%);
    border-top: 4px solid var(--primary);
  }

  .avatar-section {
    position: relative;
  }

  .verified-badge {
    position: absolute;
    bottom: -2px;
    right: -2px;
    background: var(--bg-primary);
    border-radius: 50%;
    border: 2px solid var(--bg-primary);
    display: flex;
  }

  .driver-info h2 {
    margin-bottom: var(--spacing-1);
    font-size: 1.4rem;
  }

  .driver-phone {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin-bottom: var(--spacing-2);
  }

  .trust-badge {
    display: inline-block;
    padding: 2px 10px;
    background-color: rgba(250, 196, 69, 0.15);
    color: var(--primary-dark);
    font-size: 0.75rem;
    font-weight: 700;
    border-radius: 4px;
    border: 1px solid rgba(250, 196, 69, 0.3);
  }

  .logout-mini {
    margin-right: auto;
    background: var(--bg-primary);
    border: 1px solid var(--bg-tertiary);
    color: var(--danger);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .logout-mini:hover {
    background: var(--danger);
    color: white;
    border-color: var(--danger);
  }

  .score-display {
    display: flex;
    align-items: center;
    gap: var(--spacing-5);
    margin-top: var(--spacing-2);
  }

  .score-circle {
    position: relative;
    width: 80px;
    height: 80px;
  }

  .circular-chart {
    display: block;
    margin: 0 auto;
    max-width: 80%;
    max-height: 250px;
  }

  .circle-bg {
    fill: none;
    stroke: var(--bg-tertiary);
    stroke-width: 3.8;
  }

  .circle {
    fill: none;
    stroke-width: 3.8;
    stroke-linecap: round;
    stroke: var(--primary);
    transition: stroke-dasharray 1s ease-out;
  }

  .score-number {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    display: flex;
    flex-direction: column;
    line-height: 1;
  }

  .score-number .value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .score-number .total {
    font-size: 0.65rem;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .score-details {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .stars {
    display: flex;
    gap: 4px;
  }

  .score-label {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--warning);
  }

  .vehicle-details {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    margin-bottom: var(--spacing-4);
  }

  .vehicle-icon {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, rgba(250, 196, 69, 0.15), rgba(250, 196, 69, 0.05));
    border-radius: var(--border-radius-md);
    border: 1px solid rgba(250, 196, 69, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vehicle-text h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .vehicle-text p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  .license-plate-wrapper {
    display: flex;
    justify-content: center;
    padding: var(--spacing-2) 0;
  }

  .license-plate {
    background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
    border: 3px solid #ced4da;
    border-radius: 8px;
    padding: 8px 16px;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    position: relative;
    width: 80%;
    max-width: 280px;
  }

  .license-plate::before, .license-plate::after {
    content: '';
    position: absolute;
    top: 6px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #6c757d;
  }
  
  .license-plate::before { left: 12px; }
  .license-plate::after { right: 12px; }

  .plate-header {
    color: #495057;
    font-size: 0.8rem;
    font-weight: 800;
    margin-bottom: 4px;
  }

  .plate-number {
    color: #212529;
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: 4px;
    text-shadow: 0px 1px 2px rgba(255,255,255,0.7);
    font-family: 'Monaco', 'Courier New', monospace;
  }
</style>
