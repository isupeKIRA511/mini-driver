<script lang="ts">
  import { pendingRequests, navigate, rideOffers, currentActiveRide, isAuthenticated } from '../stores/appStore';
  import { ridesApi, rideOffersApi } from '../lib/api';
  import { onMount, onDestroy } from 'svelte';
  
  let isLoading = false;
  let pollInterval: any;

  async function loadRequests() {
    if (!$isAuthenticated) {
      $pendingRequests = [];
      return;
    }
    try {
      if ($rideOffers.length === 0) {
        const offersRes = await rideOffersApi.getMyOffers();
        $rideOffers = offersRes?.data ?? [];
      }
      
      if ($rideOffers.length === 0) return;
      
      let allReqs: any[] = [];
      for (const offer of $rideOffers) {
        if (offer.status === 'AwaitingPassengers' || offer.status === 'PickingUpPassengers') {
          const res = await ridesApi.getPendingRequests(offer.id);
          if (res?.data) allReqs = [...allReqs, ...res.data];
        }
      }
      $pendingRequests = allReqs;
    } catch(e) {
      console.error('Failed fetching requests', e);
    }
  }

  async function acceptRequest(id: string) {
    try {
      // Mark internally as Accepted visually first
      pendingRequests.update(reqs => 
        reqs.map(r => r.id === id ? { ...r, status: 'Accepted' } : r)
      );
      
      await ridesApi.acceptRequest(id);
      
      setTimeout(() => {
        const req = $pendingRequests.find(r => r.id === id);
        if (req) {
           $currentActiveRide = req;
           navigate('active_trip');
        }
      }, 600);
      
    } catch(e) {
      console.error('Failed to accept request', e);
      loadRequests(); // Revert on failure
    }
  }
  
  async function declineRequest(id: string) {
    if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;
    try {
      await ridesApi.declineRequest(id);
      pendingRequests.update(reqs => reqs.filter(r => r.id !== id));
    } catch(e) {
      console.error('Failed to decline request', e);
    }
  }

  onMount(() => {
    loadRequests();
    pollInterval = setInterval(loadRequests, 10000);
  });

  onDestroy(() => {
    clearInterval(pollInterval);
  });
</script>

<div class="requests-container animate-fade container">
  <h2>الطلبات المعلقة</h2>
  
  <div class="requests-list">
    {#if $pendingRequests.length === 0}
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><polyline points="12 6 12 12 16 14"/></svg>
        <p>لا توجد طلبات معلقة حالياً.</p>
        <p class="sub-text">سنعلمك عندما يقوم شخص بحجز رحلتك.</p>
      </div>
    {/if}
    
    {#each $pendingRequests as req (req.id)}
      <div class="request-card card animate-fade {req.status === 'Accepted' ? 'accepted-state' : ''}">
        {#if req.status === 'Accepted'}
          <div class="success-overlay">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span>تم قبول الراكب</span>
          </div>
        {:else}
          <div class="passenger-info">
            <div class="avatar-placeholder">
              {req.passengerName ? req.passengerName.charAt(0) : 'ر'}
            </div>
            <div class="details">
              <h4>{req.passengerName || 'راكب'}</h4>
              <div class="rating">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--warning)" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                جديد
              </div>
            </div>
            
            <div class="offer-link">
              <span class="badge badge-gold">إلى {req.dropoffProvince}</span>
            </div>
          </div>
          
          <div class="action-buttons">
            <button class="btn btn-solid-success" on:click={() => acceptRequest(req.id)}>
              قبول
            </button>
            <button class="btn btn-outline-danger" on:click={() => declineRequest(req.id)}>
              رفض
            </button>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .empty-state {
    text-align: center;
    padding: var(--spacing-6) 0;
    color: var(--text-muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-3);
  }
  
  .sub-text {
    font-size: 0.85rem;
    opacity: 0.7;
  }
  
  .request-card {
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .passenger-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    margin-bottom: var(--spacing-4);
  }
  
  .avatar-placeholder {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary));
    border: 1px solid var(--primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  
  .details h4 {
    margin: 0 0 4px 0;
    font-size: 1.1rem;
  }
  
  .rating {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85rem;
    color: var(--text-secondary);
  }
  
  .offer-link {
    margin-right: auto; /* changed from left to right for RTL */
  }
  
  .action-buttons {
    display: flex;
    gap: var(--spacing-3);
  }
  
  .action-buttons .btn {
    flex: 1;
    padding: var(--spacing-2) var(--spacing-3);
  }
  
  .btn-outline-danger {
    background-color: transparent;
    border: 2px solid var(--danger);
    color: var(--danger);
  }
  
  .btn-outline-danger:hover {
    background-color: rgba(186, 26, 26, 0.1);
  }
  
  .btn-solid-success {
    background-color: var(--success);
    color: white;
    border: 2px solid var(--success);
    box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
  }
  
  .btn-solid-success:hover {
    background-color: #059669;
    border-color: #059669;
  }
  
  .accepted-state {
    border-color: var(--success);
  }
  
  .success-overlay {
    padding: var(--spacing-4);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    color: var(--success);
    font-weight: 600;
    animation: fadeIn 0.3s ease forwards;
  }
</style>
