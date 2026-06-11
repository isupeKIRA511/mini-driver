<script lang="ts">
  import {
    activeTripStatus,
    currentView,
    currentActiveRide,
  } from "../stores/appStore";
  import { ridesApi, rideOffersApi } from "../lib/api";
  import { onMount, tick } from "svelte";

  let mapElement: HTMLElement;
  let map: any;
  let isLoading = false;

  const tripDetails = {
    passengerName: $currentActiveRide?.passengerName || "ركاب",
    pickup: $currentActiveRide?.pickupProvince || "بغداد",
    dropoff: $currentActiveRide?.dropoffProvince || "البصرة",
  };


  function getCallNumber() {
    // حسب الدوك: RideModel فيه driverPhoneNumber، لكن الـ UI طلب اتصال "للمستخدم"
    // سنستخدم أول رقم متوفر بأفضلية: passengerPhone* ثم phoneNumber ثم driverPhoneNumber
    return (
      $currentActiveRide?.passengerPhoneNumber ||
      $currentActiveRide?.passengerPhone ||
      $currentActiveRide?.phoneNumber ||
      $currentActiveRide?.driverPhoneNumber ||
      ""
    );
  }

  function formatTelNumber(raw: string) {
    if (!raw) return "";
    // إزالة مسافات/رموز غير رقمية مع الاحتفاظ بإشارة +
    const trimmed = String(raw).trim();
    const withPlus = trimmed.startsWith("+")
      ? trimmed
      : trimmed.replace(/[^\d]/g, "");
    if (withPlus.startsWith("+"))
      return "+" + withPlus.slice(1).replace(/[^\d]/g, "");
    return withPlus;
  }

  const callNumber = formatTelNumber(getCallNumber());

  async function cancelCurrentTrip() {
    if (!$currentActiveRide) return;

    const rideOfferId =
      $currentActiveRide?.rideOfferId ||
      $currentActiveRide?.ride_offer_id ||
      $currentActiveRide?.rideOfferID;

    if (!rideOfferId) {
      alert("لا يمكن إلغاء الرحلة لأن رقم العرض غير متوفر.");
      return;
    }

    if (!confirm("هل أنت متأكد من إلغاء الرحلة؟")) return;

    isLoading = true;
    cancelledByDriver = false;
    try {
      await rideOffersApi.cancelOffer(String(rideOfferId));

      // تحديث الحالة: إرجاع المستخدم للعروض
      cancelledByDriver = true;
      $currentActiveRide = null;
      $currentView = "offers";
    } catch (e) {
      console.error(e);
      alert("فشل إلغاء الرحلة. حاول مرة أخرى.");
    } finally {
      isLoading = false;
    }
  }

  async function nextStatus() {
    if (!$currentActiveRide) return;
    isLoading = true;

    try {
      if ($activeTripStatus === "Not Started") {
        await ridesApi.startPickup($currentActiveRide.id);
        $activeTripStatus = "Heading to Pickup";
      } else if ($activeTripStatus === "Heading to Pickup") {
        await ridesApi.markArrived($currentActiveRide.id);
        $activeTripStatus = "Arrived at Pickup";
      } else if ($activeTripStatus === "Arrived at Pickup") {
        // Local state change: starting the trip
        $activeTripStatus = "In Progress";
      } else if ($activeTripStatus === "In Progress") {
        await ridesApi.completeTrip($currentActiveRide.id);
        $activeTripStatus = "Completed";
      }
    } catch (e) {
      console.error(e);
    } finally {
      isLoading = false;
    }
  }

  function getButtonText() {
    switch ($activeTripStatus) {
      case "Not Started":
        return "التوجه لنقطة الالتقاء";
      case "Heading to Pickup":
        return "لقد وصلت لنقطة الالتقاء";
      case "Arrived at Pickup":
        return "بدء الرحلة";
      case "In Progress":
        return "إنهاء الرحلة";
      case "Completed":
        return "العودة للرئيسية";
      default:
        return "بدء";
    }
  }

  function getStatusArabic() {
    switch ($activeTripStatus) {
      case "Not Started":
        return "بإنتظار الإنطلاق";
      case "Heading to Pickup":
        return "جاري التوجه للراكب";
      case "Arrived at Pickup":
        return "في موقع الالتقاء";
      case "In Progress":
        return "في الطريق للوجهة";
      case "Completed":
        return "تم إكمال الرحلة";
      default:
        return "";
    }
  }

  function handleAction() {
    if ($activeTripStatus === "Completed") {
      $activeTripStatus = "Not Started";
      $currentActiveRide = null;
      $currentView = "offers";
    } else {
      nextStatus();
    }
  }

  function getProgressWidth() {
    switch ($activeTripStatus) {
      case "Not Started":
        return "0%";
      case "Heading to Pickup":
        return "25%";
      case "Arrived at Pickup":
        return "50%";
      case "In Progress":
        return "75%";
      case "Completed":
        return "100%";
      default:
        return "0%";
    }
  }

  onMount(async () => {
    await tick();
    try {
      const Leaflet = (globalThis as any).L;
      if (Leaflet && mapElement) {
        const lat = $currentActiveRide?.destinationLatitude || 33.3152;
        const lng = $currentActiveRide?.destinationLongitude || 44.3661;

        map = Leaflet.map(mapElement, {
          zoomControl: false,
          attributionControl: false,
        }).setView([lat, lng], 13);

        Leaflet.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
          },
        ).addTo(map);

        // Add driver marker
        const driverIcon = Leaflet.divIcon({
          className: "custom-driver-marker",
          html: `<div class="map-driver-pin"></div>`,
          iconSize: [24, 24],
        });
        Leaflet.marker([lat, lng], { icon: driverIcon }).addTo(map);
      } else {
        console.warn("Leaflet is not available; map will not be initialized.");
      }
    } catch (err) {
      console.warn("Failed to initialize map (Leaflet):", err);
    }
  });
</script>

<div class="active-trip-container animate-fade container">
  <!-- Interactive Map -->
  <div class="map-wrapper" bind:this={mapElement}></div>

  <!-- Trip Info -->
  <div class="trip-info card">
    <div class="status-badge">
      <span class="pulse-dot"></span>
      {getStatusArabic()}
    </div>

    <div class="passenger">
      <div class="avatar-sm">{tripDetails.passengerName.charAt(0)}</div>
      <div class="p-details">
        <h4>{tripDetails.passengerName}</h4>
        <span>راكب</span>
      </div>

      {#if callNumber}
        <a class="btn-icon" aria-label="اتصال" href={`tel:${callNumber}`}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            ><path
              d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
            /></svg
          >
        </a>
      {:else}
        <button
          class="btn-icon"
          aria-label="اتصال"
          disabled
          title="رقم الهاتف غير متوفر"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            ><path
              d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
            /></svg
          >
        </button>
      {/if}
    </div>

    <div class="route-timeline">
      <div class="timeline-item">
        <div class="timeline-dot pickup"></div>
        <div class="timeline-content">
          <span class="label">نقطة الانطلاق</span>
          <p>{tripDetails.pickup}</p>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-dot dropoff"></div>
        <div class="timeline-content">
          <span class="label">نقطة الوصول</span>
          <p>{tripDetails.dropoff}</p>
        </div>
      </div>
    </div>

    <div class="trip-meta">
      <!-- Removed mocked generic distance & time -->
      <div class="meta-item">
        <strong>السعر</strong>
        <span
          >{$currentActiveRide?.price
            ? $currentActiveRide.price + " ع.د"
            : "---"}</span
        >
      </div>
    </div>
  </div>

  <!-- Status Control Panel -->
  <div class="control-panel">
    <div class="progress-bar-wrapper">
      <div class="progress-fill" style="width: {getProgressWidth()}"></div>
    </div>

    <div class="control-actions">
      {#if $activeTripStatus !== "Completed"}
        <button
          class="btn btn-large btn-outline-danger cancel-trip-btn"
          on:click={cancelCurrentTrip}
          disabled={isLoading}
        >
          {isLoading ? "..." : "إلغاء الرحلة"}
        </button>
      {/if}

      <button
        class="btn btn-large {$activeTripStatus === 'Completed'
          ? 'btn-success'
          : 'btn-primary'}"
        on:click={handleAction}
        disabled={isLoading}
      >
        {isLoading ? "جاري التحميل..." : getButtonText()}
        {#if !isLoading}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            style="transform: scaleX(-1);"
            ><path d="M5 12h14M12 5l7 7-7 7" /></svg
          >
        {/if}
      </button>
    </div>

    {#if isLoading}
      <div class="mini-hint">جاري التنفيذ...</div>
    {/if}
  </div>
</div>

<style>
  .active-trip-container {
    padding: 0;
    position: relative;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .map-wrapper {
    height: 40vh;
    width: 100%;
    z-index: 1;
    background-color: #f3eced;
  }

  :global(.map-driver-pin) {
    width: 24px;
    height: 24px;
    background: var(--primary);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  }

  .trip-info {
    margin: -24px var(--spacing-4) 0;
    position: relative;
    z-index: 10;
    flex: 1;
    overflow-y: auto;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom: none;
    margin-bottom: 0;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(250, 196, 69, 0.12);
    color: var(--primary-dark);
    padding: 6px 14px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 0.85rem;
    margin-bottom: var(--spacing-4);
    border: 1px solid rgba(250, 196, 69, 0.25);
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    background-color: var(--primary);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(250, 196, 69, 0.7);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 6px rgba(250, 196, 69, 0);
    }
    100% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(250, 196, 69, 0);
    }
  }

  .passenger {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding-bottom: var(--spacing-4);
    border-bottom: 1px solid var(--bg-tertiary);
    margin-bottom: var(--spacing-4);
  }

  .avatar-sm {
    width: 40px;
    height: 40px;
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }

  .p-details h4 {
    margin: 0;
    font-size: 1rem;
  }
  .p-details span {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .btn-icon {
    margin-right: auto;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--bg-tertiary);
    border: none;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .route-timeline {
    position: relative;
    margin-bottom: var(--spacing-4);
    padding-right: var(--spacing-2);
  }

  .route-timeline::before {
    content: "";
    position: absolute;
    right: 17px;
    top: 16px;
    bottom: 16px;
    width: 2px;
    background: var(--bg-tertiary);
  }

  .timeline-item {
    display: flex;
    gap: var(--spacing-3);
    margin-bottom: var(--spacing-4);
    position: relative;
  }

  .timeline-dot {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--bg-secondary);
    border: 3px solid;
    margin-top: 4px;
    z-index: 1;
  }

  .timeline-dot.pickup {
    border-color: var(--primary);
  }
  .timeline-dot.dropoff {
    border-color: var(--success);
  }

  .timeline-content {
    margin-right: var(--spacing-2);
  }

  .timeline-content .label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 700;
  }

  .timeline-content p {
    margin: 0;
    color: var(--text-primary);
    font-weight: 500;
  }

  .trip-meta {
    display: flex;
    gap: var(--spacing-3);
    padding-top: var(--spacing-4);
    border-top: 1px solid var(--bg-tertiary);
  }

  .meta-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--bg-primary);
    padding: var(--spacing-3);
    border-radius: var(--border-radius-md);
  }

  .meta-item strong {
    font-size: 1.1rem;
    color: var(--text-primary);
  }

  .meta-item span {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .control-panel {
    background: var(--bg-secondary);
    padding: var(--spacing-4);
    border-top: 1px solid var(--bg-tertiary);
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.05);
  }

  .control-actions {
    display: flex;
    gap: var(--spacing-3);
    align-items: center;
    justify-content: space-between;
  }

  .cancel-trip-btn {
    white-space: nowrap;
    padding: 0 16px;
  }

  .btn-outline-danger {
    background: transparent;
    border: 2px solid var(--danger);
    color: var(--danger);
  }

  .btn-outline-danger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .mini-hint {
    margin-top: var(--spacing-2);
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .progress-bar-wrapper {
    height: 6px;
    background: var(--bg-tertiary);
    border-radius: 3px;
    margin-bottom: var(--spacing-4);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(
      90deg,
      var(--primary),
      var(--primary-container)
    );
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  .btn-large {
    height: 56px;
    font-size: 1.1rem;
  }

  .btn-success {
    background-color: var(--success);
    color: white;
  }
</style>
