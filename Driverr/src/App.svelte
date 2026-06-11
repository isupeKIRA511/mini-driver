<script lang="ts">
  import {
    currentView,
    navigate,
    goBack,
    navHistory,
    isAuthenticated,
  } from "./stores/appStore";
  import Auth from "./components/Auth.svelte";
  import Profile from "./components/Profile.svelte";
  import RideOffers from "./components/RideOffers.svelte";
  import Requests from "./components/Requests.svelte";
  import ActiveTrip from "./components/ActiveTrip.svelte";



  // Page titles for the header
  const pageTitles: Record<string, string> = {
    auth: "تسجيل الدخول",
    otp: "رمز التحقق",
    offers: "عروضي",
    create_offer: "إنشاء رحلة",
    requests: "الطلبات",
    active_trip: "الرحلة النشطة",
    profile: "حسابي",
  };

  $: pageTitle = pageTitles[$currentView] ?? "تطبيق السائق";
  // Only show back button if we're not on the root auth pages and have history
  $: showBack =
    $navHistory.length > 1 &&
    $currentView !== "offers" &&
    $currentView !== "auth";

  // Define full-screen views (no bottom nav)
  $: isFullScreen =
    $currentView === "auth" ||
    $currentView === "otp" ||
    $currentView === "active_trip";

  // Auth Guard: If not authenticated and not on an auth page, go to auth
  $: if (
    !$isAuthenticated &&
    $currentView !== "auth" &&
    $currentView !== "otp"
  ) {
    currentView.set("auth");
  }
</script>

<div class="app-shell">
    <!-- Top Header (Only if not Auth) -->
    {#if $currentView !== "auth" && $currentView !== "otp"}
      <header class="top-header">
        <div class="header-start">
          {#if showBack}
            <button class="back-btn" on:click={goBack} aria-label="عودة">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          {:else}
            <div class="header-logo">
              <div class="logo-dot"></div>
              <span>TransPay</span>
            </div>
          {/if}
        </div>

        <h1 class="page-title">{pageTitle}</h1>

        <div class="header-end">
          <div class="header-badge">
            <span class="live-dot"></span>
            مباشر
          </div>
        </div>
      </header>
    {/if}

    <!-- Main Content -->
    <main class="view-content" class:no-padding={isFullScreen}>
      {#if $currentView === "auth" || $currentView === "otp"}
        <Auth />
      {:else if $currentView === "profile"}
        <Profile />
      {:else if $currentView === "offers" || $currentView === "create_offer"}
        <RideOffers />
      {:else if $currentView === "requests"}
        <Requests />
      {:else if $currentView === "active_trip"}
        <ActiveTrip />
      {/if}
    </main>

    <!-- Bottom Navigation -->
    {#if !isFullScreen && $isAuthenticated}
      <nav class="bottom-nav">
        <button
          class="nav-item"
          class:active={$currentView === "offers" ||
            $currentView === "create_offer"}
          on:click={() => navigate("offers")}
        >
          <div class="nav-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="1" y="3" width="15" height="13" rx="2" />
              <path d="M16 8h4l3 5v3h-7V8z" /><circle
                cx="5.5"
                cy="18.5"
                r="2.5"
              /><circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <span>رحلاتي</span>
        </button>

        <button
          class="nav-item"
          class:active={$currentView === "requests"}
          on:click={() => navigate("requests")}
        >
          <div class="nav-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <span>الطلبات</span>
        </button>

        <button
          class="nav-item nav-center-btn"
          class:active={$currentView === "active_trip"}
          on:click={() => navigate("active_trip")}
        >
          <div class="nav-icon nav-center-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon
                points="10 8 16 12 10 16 10 8"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </div>
          <span>رحلتي</span>
        </button>

        <button
          class="nav-item"
          class:active={$currentView === "profile"}
          on:click={() => navigate("profile")}
        >
          <div class="nav-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span>حسابي</span>
        </button>
      </nav>
    {/if}
  </div>


<style>
  .app-shell {
    width: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    position: relative;
    background-color: var(--bg-primary);
  }

  /* ── Top Header ── */
  .top-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #ffffff;
    border-bottom: 1px solid var(--bg-tertiary);
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.05);
    position: sticky;
    top: 0;
    z-index: 100;
    gap: 8px;
  }

  .header-start {
    min-width: 44px;
    display: flex;
    align-items: center;
  }

  .header-end {
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .page-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    text-align: center;
    flex: 1;
    letter-spacing: -0.3px;
  }

  .back-btn {
    background: var(--bg-tertiary);
    border: none;
    cursor: pointer;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-primary);
    transition: all 0.2s ease;
    transform: scaleX(-1);
  }

  .back-btn:hover {
    background: rgba(250, 196, 69, 0.15);
    color: var(--primary-dark);
  }

  .header-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1rem;
    font-weight: 800;
    color: var(--on-primary);
    letter-spacing: -0.3px;
  }

  .logo-dot {
    width: 26px;
    height: 26px;
    background: linear-gradient(
      135deg,
      var(--primary-container),
      var(--primary)
    );
    border-radius: 7px;
    box-shadow: 0 3px 8px rgba(250, 196, 69, 0.4);
  }

  .header-badge {
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
    border: 1px solid rgba(16, 185, 129, 0.25);
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 0.72rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .live-dot {
    width: 6px;
    height: 6px;
    background: var(--success);
    border-radius: 50%;
    animation: livePulse 1.5s ease-in-out infinite;
  }

  @keyframes livePulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.85);
    }
  }

  /* ── Content Area ── */
  .view-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding-bottom: 100px;
    background: var(--bg-primary);
  }

  .view-content.no-padding {
    padding-bottom: 0;
  }

  /* ── Bottom Navigation ── */
  .bottom-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    position: absolute;
    bottom: 14px;
    left: 14px;
    right: 14px;
    border-radius: 28px;
    padding: 10px 16px;
    z-index: 100;
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: none;
    color: #a09a8f;
    cursor: pointer;
    font-size: 0.65rem;
    font-weight: 700;
    font-family: var(--font-family);
    padding: 4px 8px;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    flex: 1;
  }

  .nav-item .nav-icon {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
    border-radius: 12px;
  }

  .nav-item.active {
    color: var(--primary-dark);
  }

  .nav-item.active .nav-icon {
    transform: translateY(-2px);
    color: var(--primary-dark);
    filter: drop-shadow(0 4px 6px rgba(250, 196, 69, 0.3));
  }

  .nav-item:hover {
    color: var(--text-primary);
  }

  /* Center button */
  .nav-center-btn {
    flex: 1;
  }

  .nav-center-icon {
    background: rgba(250, 196, 69, 0.15);
    border-radius: 12px;
    color: var(--primary-dark);
  }

  .nav-center-btn.active .nav-center-icon {
    background: rgba(250, 196, 69, 0.25);
    filter: drop-shadow(0 2px 4px rgba(250, 196, 69, 0.3));
  }
</style>
