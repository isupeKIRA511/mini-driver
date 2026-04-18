<script lang="ts">
  import { navigate, rideOffers, isAuthenticated } from '../stores/appStore';
  import { rideOffersApi } from '../lib/api';
  import { onMount } from 'svelte';
  
  let isCreating = false;
  let isLoading = false;
  let loadError = '';
  
  const governorates = [
    { name: 'بغداد', enName: 'Baghdad', lat: 33.3152, lng: 44.3661 },
    { name: 'البصرة', enName: 'Basra', lat: 30.5081, lng: 47.7835 },
    { name: 'أربيل', enName: 'Erbil', lat: 36.1901, lng: 44.0090 },
    { name: 'النجف', enName: 'Najaf', lat: 31.9960, lng: 44.3148 },
    { name: 'كربلاء', enName: 'Karbala', lat: 32.6160, lng: 44.0249 },
    { name: 'السليمانية', enName: 'Sulaymaniyah', lat: 35.5558, lng: 45.4351 },
    { name: 'دهوك', enName: 'Duhok', lat: 36.8679, lng: 42.9489 },
    { name: 'كركوك', enName: 'Kirkuk', lat: 35.4670, lng: 44.3832 },
    { name: 'الموصل', enName: 'Mosul', lat: 36.3489, lng: 43.1311 }
  ];
  
  let newOffer = {
    departure: governorates[0].name,
    arrival: governorates[1].name,
    price: 15000,
    maxPassengers: 4,
    time: ''
  };
  
  function incrementPassengers() {
    if (newOffer.maxPassengers < 6) newOffer.maxPassengers++;
  }
  
  function decrementPassengers() {
    if (newOffer.maxPassengers > 1) newOffer.maxPassengers--;
  }
  
  async function loadOffers() {
    // Don't call API if not authenticated
    if (!$isAuthenticated) {
      $rideOffers = [];
      return;
    }
    isLoading = true;
    loadError = '';
    try {
      const res = await rideOffersApi.getMyOffers();
      $rideOffers = res?.data ?? [];
    } catch (e: any) {
      loadError = e.message || 'تعذر تحميل الرحلات';
    } finally {
      isLoading = false;
    }
  }

  async function publishRide() {
    if (!$isAuthenticated) {
      loadError = 'يجب تسجيل الدخول أولاً';
      return;
    }
    isLoading = true;
    loadError = '';
    try {
      const startGov = governorates.find(g => g.name === newOffer.departure);
      const destGov = governorates.find(g => g.name === newOffer.arrival);
      
      await rideOffersApi.createOffer({
        price: newOffer.price,
        pickupProvince: startGov ? startGov.enName : newOffer.departure,
        dropoffProvince: destGov ? destGov.enName : newOffer.arrival,
        destinationLatitude: destGov ? destGov.lat : 33.3152,
        destinationLongitude: destGov ? destGov.lng : 44.3661,
        maxPassengers: newOffer.maxPassengers,
        oneTripOnly: true
      });
      isCreating = false;
      await loadOffers();
    } catch (e: any) {
      loadError = e.message || 'حدث خطأ أثناء نشر الرحلة';
    } finally {
      isLoading = false;
    }
  }
  
  async function cancelOffer(id: string) {
    if (confirm('هل أنت متأكد من إلغاء هذه الرحلة؟')) {
      try {
        await rideOffersApi.cancelOffer(id);
        await loadOffers();
      } catch(e) {
        console.error(e);
      }
    }
  }
  
  function getBadgeClass(status: string) {
    switch(status) {
      case 'AwaitingPassengers': return 'badge-yellow';
      case 'PickingUpPassengers': return 'badge-blue';
      case 'Transporting': return 'badge-blue';
      case 'Completed': return 'badge-green';
      default: return '';
    }
  }

  function getStatusArabic(status: string) {
    switch(status) {
      case 'AwaitingPassengers': return 'بإنتظار الركاب';
      case 'PickingUpPassengers': return 'جاري الإقلال';
      case 'Transporting': return 'في الطريق';
      case 'Completed': return 'مكتملة';
      case 'DriverCancelled': return 'ملغاة';
      default: return status;
    }
  }

  onMount(() => {
    if ($isAuthenticated) {
      loadOffers();
    }
  });
</script>

<div class="offers-container animate-fade container">
  <div class="header-action">
    <h2>{isCreating ? 'إنشاء رحلة' : 'عروضي'}</h2>
    {#if !isCreating}
      <button class="btn-create" on:click={() => isCreating = true}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    {:else}
      <button class="btn-ghost" on:click={() => isCreating = false}>إلغاء</button>
    {/if}
  </div>

  {#if isCreating}
    <div class="create-form card animate-fade">
      <div class="form-group">
        <label>نقطة الانطلاق</label>
        <select bind:value={newOffer.departure} class="input-field select-input">
          {#each governorates as gov}
            <option value={gov.name}>{gov.name}</option>
          {/each}
        </select>
      </div>

      <div class="form-group swap-icon-wrapper">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="swap-icon" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="14" x2="21" y2="3"></line><polyline points="8 21 3 21 3 16"></polyline><line x1="20" y1="10" x2="3" y2="21"></line></svg>
      </div>

      <div class="form-group">
        <label>نقطة الوصول</label>
        <select bind:value={newOffer.arrival} class="input-field select-input">
          {#each governorates as gov}
            <option value={gov.name}>{gov.name}</option>
          {/each}
        </select>
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label>السعر (ع.د)</label>
          <div class="price-input-wrapper">
            <span class="currency">ع.د</span>
            <input type="number" bind:value={newOffer.price} class="input-field pr-12" />
          </div>
        </div>

        <div class="form-group flex-1">
          <label>عدد الركاب</label>
          <div class="stepper">
            <button class="stepper-btn" on:click={incrementPassengers}>+</button>
            <span class="stepper-val">{newOffer.maxPassengers}</span>
            <button class="stepper-btn" on:click={decrementPassengers}>-</button>
          </div>
        </div>
      </div>

      <button class="btn btn-primary publish-btn" on:click={publishRide} disabled={isLoading}>
        {isLoading ? 'جاري النشر...' : 'نشر الرحلة'}
      </button>
    </div>
  {:else}
    <div class="offers-list">
      {#if isLoading}
        <div class="empty-state">
           <p>جاري التحميل...</p>
        </div>
      {:else if $rideOffers.length === 0}
        <div class="empty-state">
          <p>لا توجد لديك رحلات نشطة.</p>
          <button class="btn-ghost" on:click={() => isCreating = true}>إنشاء أول رحلة لك</button>
        </div>
      {/if}
      
      {#each $rideOffers as offer (offer.id)}
        <div class="offer-card card animate-fade">
          <div class="offer-header">
            <div class="route">
              <span class="city">{offer.pickupProvince}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="transform: scaleX(-1);"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              <span class="city">{offer.dropoffProvince}</span>
            </div>
            <span class="badge {getBadgeClass(offer.status)}">{getStatusArabic(offer.status)}</span>
          </div>
          
          <div class="offer-details">
            <div class="info-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {offer.passengersCount} / {offer.maxPassengers === 0 ? 'مفتوح' : offer.maxPassengers} ركاب
            </div>
            <div class="price-tag">
              {offer.price} <span class="per-seat">ع.د / للمقعد</span>
            </div>
          </div>
          
          <div class="offer-actions">
            {#if offer.status !== 'Completed' && offer.status !== 'DriverCancelled'}
            <button class="btn btn-outline cancel-btn" on:click={() => cancelOffer(offer.id)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              إلغاء الرحلة
            </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .header-action {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-4);
  }
  
  .btn-create {
    background: linear-gradient(135deg, var(--primary-container), var(--primary));
    color: var(--on-primary);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(250, 196, 69, 0.4);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .btn-create:hover {
    box-shadow: 0 6px 20px rgba(250, 196, 69, 0.55);
    transform: scale(1.05);
  }
  
  .btn-create:active {
    transform: scale(0.95);
  }

  .select-input {
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23cbd5e1%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
    background-repeat: no-repeat;
    background-position: left 1rem top 50%;
    background-size: 0.65rem auto;
  }

  .swap-icon-wrapper {
    display: flex;
    justify-content: center;
    margin: -10px 0;
    z-index: 2;
  }

  .swap-icon {
    background-color: var(--bg-tertiary);
    border-radius: 50%;
    padding: 4px;
    box-shadow: 0 0 0 4px var(--bg-secondary);
  }

  .form-row {
    display: flex;
    gap: var(--spacing-3);
  }
  
  .flex-1 { flex: 1; }
  
  .price-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .currency {
    position: absolute;
    right: var(--spacing-3);
    color: var(--text-muted);
    font-weight: 600;
    font-size: 0.9rem;
  }
  
  .pr-12 { padding-right: 3rem; }
  
  .stepper {
    display: flex;
    align-items: center;
    background-color: var(--bg-secondary);
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--border-radius-md);
    overflow: hidden;
  }
  
  .stepper-btn {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-size: 1.25rem;
    padding: var(--spacing-2) 0;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .stepper-btn:hover { background-color: var(--bg-tertiary); }
  .stepper-val {
    flex: 1;
    text-align: center;
    font-weight: 600;
    border-left: 1px solid var(--bg-tertiary);
    border-right: 1px solid var(--bg-tertiary);
    padding: var(--spacing-2) 0;
  }

  .publish-btn { margin-top: var(--spacing-4); }

  .offer-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-3);
    padding-bottom: var(--spacing-3);
    border-bottom: 1px solid var(--bg-tertiary);
  }

  .route {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-weight: 600;
    font-size: 1.1rem;
  }

  .offer-details {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-3);
    margin-bottom: var(--spacing-4);
    align-items: center;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .price-tag {
    margin-right: auto;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--success);
  }

  .per-seat {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-weight: 400;
  }
  
  .offer-actions {
    display: flex;
    justify-content: flex-start;
  }
  
  .cancel-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
    width: auto;
  }
  
  .empty-state {
    text-align: center;
    padding: var(--spacing-6) 0;
    color: var(--text-muted);
  }
</style>
