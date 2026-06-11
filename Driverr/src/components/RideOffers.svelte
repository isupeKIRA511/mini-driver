<script lang="ts">
  import { navigate, rideOffers, isAuthenticated } from "../stores/appStore";
  import { rideOffersApi } from "../lib/api";
  import { onMount } from "svelte";

  let isCreating = false;
  let isLoading = false;
  let loadError = "";

  let editingOfferId: string | null = null;
  let locallyCreatedOffers: any[] = [];
  // جميع المحافظات العراقية مع أسماء إنجليزية للربط مع الـ backend
  const governorates = [
    { name: "بغداد", enName: "Baghdad", lat: 33.3152, lng: 44.3661 },
    { name: "الأنبار", enName: "Al Anbar", lat: 33.4066, lng: 42.9889 },
    { name: "بابل", enName: "Babil", lat: 32.5424, lng: 44.42 },
    { name: "البصرة", enName: "Basra", lat: 30.5081, lng: 47.7835 },
    { name: "ذي قار", enName: "Dhi Qar", lat: 31.0516, lng: 46.2631 },
    { name: "ديالى", enName: "Diyala", lat: 33.5206, lng: 44.5995 },
    { name: "دهوك", enName: "Duhok", lat: 36.8679, lng: 42.9489 },
    { name: "أربيل", enName: "Erbil", lat: 36.1901, lng: 44.009 },
    { name: "كربلاء", enName: "Karbala", lat: 32.616, lng: 44.0249 },
    { name: "كركوك", enName: "Kirkuk", lat: 35.467, lng: 44.3832 },
    { name: "ميسان", enName: "Maysan", lat: 31.8742, lng: 47.1037 },
    { name: "النجف", enName: "Najaf", lat: 31.996, lng: 44.3148 },
    { name: "نينوى", enName: "Nineveh", lat: 36.3489, lng: 43.1311 },
    { name: "القادسية", enName: "Al Qadisiyah", lat: 31.9862, lng: 45.2829 },
    { name: "صلاح الدين", enName: "Salah ad Din", lat: 34.52, lng: 43.6816 },
    { name: "السليمانية", enName: "Sulaymaniyah", lat: 35.5558, lng: 45.4351 },
    { name: "واسط", enName: "Wasit", lat: 32.5656, lng: 45.3939 },
    { name: "المثنى", enName: "Muthanna", lat: 31.93, lng: 45.1028 },
  ];

  // قائمة المطارات مع أسماء إنجليزية والمحافظة التابعة لها
  const airports = [
    {
      name: "مطار بغداد الدولي",
      enName: "Baghdad International Airport",
      province: "Baghdad",
      lat: 33.2735,
      lng: 44.2345,
    },
    {
      name: "مطار أربيل الدولي",
      enName: "Erbil International Airport",
      province: "Erbil",
      lat: 36.1911,
      lng: 43.9936,
    },
    {
      name: "مطار البصرة الدولي",
      enName: "Basra International Airport",
      province: "Basra",
      lat: 30.505,
      lng: 47.78,
    },
    {
      name: "مطار النجف الأشرف",
      enName: "Najaf International Airport",
      province: "Najaf",
      lat: 31.9903,
      lng: 44.3886,
    },
    {
      name: "مطار السليمانية",
      enName: "Sulaimaniyah International Airport",
      province: "Sulaymaniyah",
      lat: 35.5606,
      lng: 45.4032,
    },
    { name: "مطار الموصل", enName: "Mosul Airport", province: "Nineveh", lat: 36.349, lng: 43.145 },
    { name: "مطار دهوك", enName: "Duhok Airport", province: "Duhok", lat: 36.869, lng: 42.988 },
    { name: "مطار كركوك", enName: "Kirkuk Airport", province: "Kirkuk", lat: 35.465, lng: 44.401 },
  ];

  let newOffer = {
    // نوع الرحلة: 'between' | 'from_airport' | 'to_airport' (الترميز تقني — التسميات بالواجهة بالعربية)
    tripType: "between",
    departure: governorates[0].name,
    arrival: governorates[1].name,
    airport: airports[0].name,
    price: 15000,
    maxPassengers: 4,
    time: "",
  };

  // لا توجد خريطة في نموذج الإنشاء — الخريطة تظهر فقط في صفحة "رحلتي"

  function incrementPassengers() {
    if (newOffer.maxPassengers < 6) newOffer.maxPassengers++;
  }

  function decrementPassengers() {
    if (newOffer.maxPassengers > 1) newOffer.maxPassengers--;
  }

  function offerId(offer: any) {
    return offer?.id || offer?.rideOfferId || offer?.ride_offer_id || offer?.rideOfferID;
  }

  function extractOfferArray(res: any) {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res)) return res;
    return [];
  }

  function visibleOffers(offers: any[]) {
    return offers.filter(
      (o: any) => o.status !== "DriverCancelled" && o.status !== "Completed",
    );
  }

  function mergeWithLocalOffers(serverOffers: any[]) {
    const merged = [...visibleOffers(serverOffers)];
    const seen = new Set(merged.map(offerId).filter(Boolean));

    for (const offer of locallyCreatedOffers) {
      const id = offerId(offer);
      if (!id || seen.has(id)) continue;
      if (offer.status === "DriverCancelled" || offer.status === "Completed") continue;
      merged.unshift(offer);
      seen.add(id);
    }

    return merged;
  }

  async function loadOffers() {
    // لا تنادي الـ API إذا لم يكن المستخدم مسجلاً
    if (!$isAuthenticated) {
      $rideOffers = [];
      return;
    }
    isLoading = true;
    loadError = "";
    try {
      const res = await rideOffersApi.getMyOffers();
      $rideOffers = mergeWithLocalOffers(extractOfferArray(res));
    } catch (e: any) {
      loadError = e.message || "تعذر تحميل الرحلات";
    } finally {
      isLoading = false;
    }
  }

  async function publishRide() {
    if (!$isAuthenticated) {
      loadError = "يجب تسجيل الدخول أولاً";
      return;
    }
    isLoading = true;
    loadError = "";
    try {
      // تحديد الإحداثيات ونصوص نقطة الانطلاق والوصول بناءً على نوع الرحلة
      let destLat = 33.3152;
      let destLng = 44.3661;
      let pickupProvince = "";
      let dropoffProvince = "";

      // Helper: map displayed Arabic name to backend-friendly name (prefer enName when available)
      function mapToBackendName(displayName: string) {
        const ap = airports.find(
          (a) => a.name === displayName || a.enName === displayName,
        );
        if (ap) return ap.province || ap.enName || ap.name;
        
        const gov = governorates.find(
          (g) => g.name === displayName || g.enName === displayName,
        );
        if (gov) return gov.enName || gov.name;
        return displayName;
      }

      if (newOffer.tripType === "from_airport") {
        // من المطار إلى المنزل
        const ap = airports.find(
          (a) => a.name === newOffer.airport || a.enName === newOffer.airport,
        );
        const gov = governorates.find(
          (g) => g.name === newOffer.arrival || g.enName === newOffer.arrival,
        );
        destLat = gov ? gov.lat : destLat;
        destLng = gov ? gov.lng : destLng;
        
        pickupProvince = ap ? ap.province : "Baghdad";
        dropoffProvince = mapToBackendName(newOffer.arrival);
      } else if (newOffer.tripType === "to_airport") {
        // من المنزل إلى المطار
        const ap = airports.find(
          (a) => a.name === newOffer.airport || a.enName === newOffer.airport,
        );
        destLat = ap ? ap.lat : destLat;
        destLng = ap ? ap.lng : destLng;
        
        pickupProvince = mapToBackendName(newOffer.departure);
        dropoffProvince = ap ? ap.province : "Baghdad";
      } else {
        pickupProvince = mapToBackendName(newOffer.departure);
        dropoffProvince = mapToBackendName(newOffer.arrival);
        
        const govEnd = governorates.find(
          (g) => g.name === newOffer.arrival || g.enName === newOffer.arrival,
        );
        destLat = govEnd ? govEnd.lat : destLat;
        destLng = govEnd ? govEnd.lng : destLng;
      }

      // Build a clean payload with proper numeric types
      const payload = {
        price: Math.round(Number(newOffer.price) || 0),
        pickupProvince,
        dropoffProvince,
        destinationLatitude: Number(destLat) || 0,
        destinationLongitude: Number(destLng) || 0,
        maxPassengers: parseInt(String(newOffer.maxPassengers), 10) || 1,
        oneTripOnly: newOffer.tripType !== "between",
      };

      console.debug("[RideOffers] creating offer payload:", payload);
      const createRes = await rideOffersApi.createOffer(payload);
      const createdOffer = createRes?.data || createRes;
      if (createdOffer && typeof createdOffer === "object" && offerId(createdOffer)) {
        locallyCreatedOffers = [
          { passengersCount: 0, status: "AwaitingPassengers", ...payload, ...createdOffer },
          ...locallyCreatedOffers,
        ];
      }
      
      // إذا كنا نعدّل رحلة موجودة، نلغي الرحلة القديمة
      if (editingOfferId) {
        try {
          await rideOffersApi.cancelOffer(editingOfferId);
          editingOfferId = null;
        } catch (err) {
          console.warn("Failed to cancel old offer after edit", err);
        }
      }
      isCreating = false;
      await loadOffers();
    } catch (e: any) {
      loadError = e.message || "حدث خطأ أثناء نشر الرحلة";
    } finally {
      isLoading = false;
    }
  }

  async function cancelOffer(id: string | any) {
    // accept either an id string or an offer object
    let offerId: any = id;
    if (typeof id === "object" && id !== null) {
      const obj: any = id;
      offerId =
        obj.id || obj.rideOfferId || obj.ride_offer_id || obj.rideOfferID;
    }
    if (!offerId) {
      console.warn("cancelOffer: could not determine offer id", id);
      return;
    }
    if (confirm("هل أنت متأكد من إلغاء هذه الرحلة؟")) {
      try {
        await rideOffersApi.cancelOffer(offerId);
        // إزالة محلياً لتحسين استجابة الواجهة
        rideOffers.update((list) =>
          list.filter((o) => (o.id || o.rideOfferId) !== offerId),
        );
        await loadOffers();
      } catch (e) {
        console.error(e);
      }
    }
  }

  function editOffer(offer: any) {
    // ملء النموذج بالقيم من الرحلة الموجودة
    editingOfferId = offer.id;
    isCreating = true;
    // تحديد نوع الرحلة بفحص ما إذا كانت نقطة الانطلاق/الوصول مطاراً
    // Helper to map backend name to display (Arabic) name
    function backendToDisplay(name: string) {
      const ap = airports.find((a) => a.enName === name || a.name === name);
      if (ap) return ap.name;
      const gov = governorates.find(
        (g) => g.enName === name || g.name === name,
      );
      if (gov) return gov.name;
      return name;
    }

    const apPickup = airports.find(
      (a) =>
        a.name === offer.pickupProvince || a.enName === offer.pickupProvince,
    );
    const apDrop = airports.find(
      (a) =>
        a.name === offer.dropoffProvince || a.enName === offer.dropoffProvince,
    );
    if (apPickup) {
      newOffer.tripType = "from_airport";
      newOffer.airport = apPickup.name;
      newOffer.arrival =
        backendToDisplay(offer.dropoffProvince) || governorates[0].name;
    } else if (apDrop) {
      newOffer.tripType = "to_airport";
      newOffer.airport = apDrop.name;
      newOffer.departure =
        backendToDisplay(offer.pickupProvince) || governorates[0].name;
    } else {
      newOffer.tripType = "between";
      newOffer.departure =
        backendToDisplay(offer.pickupProvince) || governorates[0].name;
      newOffer.arrival =
        backendToDisplay(offer.dropoffProvince) || governorates[1].name;
    }
    newOffer.price = offer.price ?? newOffer.price;
    newOffer.maxPassengers = offer.maxPassengers ?? newOffer.maxPassengers;
    // ملاحظة: تم إزالة معاينة الخريطة من نموذج الإنشاء — التعديلات هنا لا تغير إحداثيات الخريطة
  }

  function getBadgeClass(status: string) {
    switch (status) {
      case "AwaitingPassengers":
        return "badge-yellow";
      case "PickingUpPassengers":
        return "badge-blue";
      case "Transporting":
        return "badge-blue";
      case "Completed":
        return "badge-green";
      default:
        return "";
    }
  }

  function getStatusArabic(status: string) {
    switch (status) {
      case "AwaitingPassengers":
        return "بإنتظار الركاب";
      case "PickingUpPassengers":
        return "جاري الإقلال";
      case "Transporting":
        return "في الطريق";
      case "Completed":
        return "مكتملة";
      case "DriverCancelled":
        return "ملغاة";
      default:
        return status;
    }
  }

  // تحويل اسم المطار/المحافظة الوارد من الـ backend إلى الاسم المعروض (عربي)
  function displayFromBackend(name: string) {
    if (!name) return name;
    const ap = airports.find((a) => a.enName === name || a.name === name);
    if (ap) return ap.name;
    const gov = governorates.find((g) => g.enName === name || g.name === name);
    if (gov) return gov.name;
    return name;
  }

  // لا توجد منطق خريطة هنا — الخرائط موجودة فقط في مكون "رحلتي"

  // ملاحظة: تم إزالة مستمع نقر الخريطة — النقر لن يؤثر على بيانات الرحلة المنشورة

  onMount(() => {
    if ($isAuthenticated) {
      loadOffers();
    }
  });

  function closeCreate() {
    isCreating = false;
    editingOfferId = null;
    // إعادة تعيين قيم newOffer إلى الافتراضية
    newOffer = {
      tripType: "between",
      departure: governorates[0].name,
      arrival: governorates[1].name,
      airport: airports[0].name,
      price: 15000,
      maxPassengers: 4,
      time: "",
    };
  }
</script>

<div class="offers-container animate-fade container">
  <div class="header-action">
    <h2>
      {isCreating ? (editingOfferId ? "تعديل رحلة" : "إنشاء رحلة") : "عروضي"}
    </h2>
    {#if !isCreating}
      <button
        class="btn-create"
        on:click={() => (isCreating = true)}
        aria-label="إنشاء رحلة جديدة"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><line x1="12" y1="5" x2="12" y2="19"></line><line
            x1="5"
            y1="12"
            x2="19"
            y2="12"
          ></line></svg
        >
      </button>
    {:else}
      <button class="btn-ghost" on:click={closeCreate}> >إلغاء</button>
    {/if}
  </div>

  {#if isCreating}
    <div class="create-form card animate-fade">
      {#if loadError}
        <div class="error-banner">{loadError}</div>
      {/if}
      <!-- Trip type selector -->
      <div class="trip-type-segment">
        <button
          type="button"
          class:active={newOffer.tripType === "between"}
          on:click={() => {
            newOffer.tripType = "between";
          }}
          aria-pressed={newOffer.tripType === "between"}>بين المحافظات</button
        >
        <button
          type="button"
          class:active={newOffer.tripType === "to_airport"}
          on:click={() => {
            newOffer.tripType = "to_airport";
          }}
          aria-pressed={newOffer.tripType === "to_airport"}
          >من المنزل للمطار</button
        >
        <button
          type="button"
          class:active={newOffer.tripType === "from_airport"}
          on:click={() => {
            newOffer.tripType = "from_airport";
          }}
          aria-pressed={newOffer.tripType === "from_airport"}
          >من المطار للمنزل</button
        >
      </div>

      <!-- Dynamic form fields depending on trip type -->
      {#if newOffer.tripType === "from_airport"}
        <div class="form-group">
          <label for="airport-select">اختر المطار (نقطة الانطلاق)</label>
          <select
            id="airport-select"
            bind:value={newOffer.airport}
            class="input-field select-input"
            aria-label="اختر المطار"
          >
            {#each airports as ap}
              <option value={ap.name}>{ap.name}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="arrival-select">نقطة الوصول (محافظة)</label>
          <select
            id="arrival-select"
            bind:value={newOffer.arrival}
            class="input-field select-input"
            aria-label="نقطة الوصول"
          >
            {#each governorates as gov}
              <option value={gov.name}>{gov.name}</option>
            {/each}
          </select>
        </div>
      {:else if newOffer.tripType === "to_airport"}
        <div class="form-group">
          <label for="departure-select">نقطة الانطلاق (محافظة)</label>
          <select
            id="departure-select"
            bind:value={newOffer.departure}
            class="input-field select-input"
            aria-label="نقطة الانطلاق"
          >
            {#each governorates as gov}
              <option value={gov.name}>{gov.name}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="airport-select">اختر المطار (نقطة الوصول)</label>
          <select
            id="airport-select"
            bind:value={newOffer.airport}
            class="input-field select-input"
            aria-label="اختر المطار"
          >
            {#each airports as ap}
              <option value={ap.name}>{ap.name}</option>
            {/each}
          </select>
        </div>
      {:else}
        <div class="form-group">
          <label for="departure-select">نقطة الانطلاق</label>
          <select
            id="departure-select"
            bind:value={newOffer.departure}
            class="input-field select-input"
            aria-label="نقطة الانطلاق"
          >
            {#each governorates as gov}
              <option value={gov.name}>{gov.name}</option>
            {/each}
          </select>
        </div>

        <div class="form-group swap-icon-wrapper">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            class="swap-icon"
            stroke="var(--text-muted)"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><polyline points="16 3 21 3 21 8"></polyline><line
              x1="4"
              y1="14"
              x2="21"
              y2="3"
            ></line><polyline points="8 21 3 21 3 16"></polyline><line
              x1="20"
              y1="10"
              x2="3"
              y2="21"
            ></line></svg
          >
        </div>

        <div class="form-group">
          <label for="arrival-select">نقطة الوصول</label>
          <select
            id="arrival-select"
            bind:value={newOffer.arrival}
            class="input-field select-input"
            aria-label="نقطة الوصول"
          >
            {#each governorates as gov}
              <option value={gov.name}>{gov.name}</option>
            {/each}
          </select>
        </div>
      {/if}

      <!-- Map preview removed from create form; maps are shown only inside active trip view -->

      <div class="form-row">
        <div class="form-group flex-1">
          <label for="price-input">السعر (ع.د)</label>
          <div class="price-input-wrapper">
            <span class="currency">ع.د</span>
            <input
              id="price-input"
              type="number"
              bind:value={newOffer.price}
              class="input-field pr-12"
              aria-label="السعر"
            />
          </div>
        </div>

        <div class="form-group flex-1">
          <label for="passengers-count">عدد الركاب</label>
          <input
            id="passengers-count"
            type="hidden"
            bind:value={newOffer.maxPassengers}
          />
          <div class="stepper">
            <button
              class="stepper-btn"
              on:click={incrementPassengers}
              aria-label="زيادة عدد الركاب">+</button
            >
            <span class="stepper-val">{newOffer.maxPassengers}</span>
            <button
              class="stepper-btn"
              on:click={decrementPassengers}
              aria-label="نقص عدد الركاب">-</button
            >
          </div>
        </div>
      </div>

      <button
        class="btn btn-primary publish-btn"
        on:click={publishRide}
        disabled={isLoading}
        aria-label="نشر الرحلة"
      >
        {isLoading ? "جاري النشر..." : "نشر الرحلة"}
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
          <button class="btn-ghost" on:click={() => (isCreating = true)}
            >إنشاء أول رحلة لك</button
          >
        </div>
      {/if}

      {#each $rideOffers as offer (offer.id)}
        <div class="offer-card card animate-fade">
          <div class="offer-header">
            <div class="route">
              <span class="city"
                >{displayFromBackend(offer.pickupProvince)}</span
              >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-muted)"
                stroke-width="2"
                style="transform: scaleX(-1);"
                ><path d="M5 12h14M12 5l7 7-7 7" /></svg
              >
              <span class="city"
                >{displayFromBackend(offer.dropoffProvince)}</span
              >
            </div>
            <span class="badge {getBadgeClass(offer.status)}"
              >{getStatusArabic(offer.status)}</span
            >
          </div>

          <div class="offer-details">
            <div class="info-item">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                ><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle
                  cx="9"
                  cy="7"
                  r="4"
                /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path
                  d="M16 3.13a4 4 0 0 1 0 7.75"
                /></svg
              >
              {offer.passengersCount} / {offer.maxPassengers === 0
                ? "مفتوح"
                : offer.maxPassengers} ركاب
            </div>
            <div class="price-tag">
              {offer.price} <span class="per-seat">ع.د / للمقعد</span>
            </div>
          </div>

          <div class="offer-actions">
            {#if offer.status !== "Completed" && offer.status !== "DriverCancelled"}
              <button
                class="btn btn-outline edit-btn"
                on:click={() => editOffer(offer)}
              >
                تعديل
              </button>
              <button
                class="btn btn-outline cancel-btn"
                on:click={() => cancelOffer(offer)}
                aria-label="إلغاء الرحلة"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  ><polyline points="3 6 5 6 21 6"></polyline><path
                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  ></path><line x1="10" y1="11" x2="10" y2="17"></line><line
                    x1="14"
                    y1="11"
                    x2="14"
                    y2="17"
                  ></line></svg
                >
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

  .error-banner {
    background-color: rgba(186, 26, 26, 0.1);
    color: var(--danger);
    padding: var(--spacing-3);
    border-radius: var(--border-radius-md);
    border: 1px solid rgba(186, 26, 26, 0.2);
    margin-bottom: var(--spacing-4);
    font-size: 0.9rem;
    text-align: center;
    font-weight: 500;
  }

  .btn-create {
    background: linear-gradient(
      135deg,
      var(--primary-container),
      var(--primary)
    );
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
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
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

  .flex-1 {
    flex: 1;
  }

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

  .pr-12 {
    padding-right: 3rem;
  }

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

  .stepper-btn:hover {
    background-color: var(--bg-tertiary);
  }
  .stepper-val {
    flex: 1;
    text-align: center;
    font-weight: 600;
    border-left: 1px solid var(--bg-tertiary);
    border-right: 1px solid var(--bg-tertiary);
    padding: var(--spacing-2) 0;
  }

  .publish-btn {
    margin-top: var(--spacing-4);
  }

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

  .edit-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
    margin-right: 8px;
    background: transparent;
    border: 2px solid var(--primary);
    color: var(--primary);
    border-radius: 8px;
    cursor: pointer;
  }

  .empty-state {
    text-align: center;
    padding: var(--spacing-6) 0;
    color: var(--text-muted);
  }

  /* Trip type segment */
  .trip-type-segment {
    display: flex;
    gap: 8px;
    margin-bottom: var(--spacing-4);
  }

  .trip-type-segment button {
    flex: 1;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--bg-tertiary);
    background: var(--bg-primary);
    cursor: pointer;
  }

  .trip-type-segment button.active,
  .trip-type-segment button[aria-pressed="true"] {
    background: linear-gradient(
      90deg,
      var(--primary),
      var(--primary-container)
    );
    color: var(--on-primary);
    border-color: transparent;
  }
</style>
