<script lang="ts">
  import { onMount } from 'svelte';
  import { accountApi } from '../lib/api';

  // Read companyId from URL query string
  const params = new URLSearchParams(window.location.search);

  let name = '';
  let phoneNumber = '';
  let companyId = params.get('companyId') || '3fa85f64-5717-4562-b3fc-2c963f66afa6';
  let carModel = '';
  let carBrand = '';
  let carLicensePlate = '';

  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';

  function isValid() {
    return (
      name.trim().length >= 2 &&
      phoneNumber.trim().length >= 7 &&
      companyId.trim().length >= 5 &&
      carModel.trim().length >= 1 &&
      carBrand.trim().length >= 1 &&
      carLicensePlate.trim().length >= 2
    );
  }

  async function register() {
    if (!isValid()) {
      errorMessage = 'يرجى تعبئة جميع الحقول بشكل صحيح';
      return;
    }
    isLoading = true;
    errorMessage = '';
    successMessage = '';
    try {
      await accountApi.createDriver({
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        companyId: companyId.trim(),
        carModel: carModel.trim(),
        carBrand: carBrand.trim(),
        carLicensePlate: carLicensePlate.trim(),
      });
      successMessage = 'تم تسجيل السائق بنجاح! يمكنه الآن تسجيل الدخول باستخدام رقم هاتفه.';
      // Reset form
      name = '';
      phoneNumber = '';
      carModel = '';
      carBrand = '';
      carLicensePlate = '';
      if (!params.get('companyId')) companyId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
    } catch (err: any) {
      errorMessage = err.message || 'حدث خطأ أثناء التسجيل';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="page">
  <div class="card">
    <!-- Header -->
    <div class="card-header">
      <div class="logo-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h10"/>
          <circle cx="7" cy="17" r="2"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      </div>
      <div class="header-text">
        <h1>Driver Registration</h1>
        <p>Register a new driver (no OTP required)</p>
      </div>
    </div>

    <!-- Form -->
    <div class="form">
      <!-- Full Name -->
      <div class="field full">
        <label for="drName">FULL NAME</label>
        <input
          id="drName"
          type="text"
          bind:value={name}
          placeholder="e.g. Ahmed Ali"
          class="input"
        />
      </div>

      <!-- Phone + Company ID -->
      <div class="row">
        <div class="field">
          <label for="drPhone">PHONE NUMBER</label>
          <input
            id="drPhone"
            type="tel"
            dir="ltr"
            bind:value={phoneNumber}
            placeholder="e.g. +9647712345678"
            class="input"
          />
        </div>
        <div class="field">
          <label for="drCompany">COMPANY ID</label>
          <input
            id="drCompany"
            type="text"
            dir="ltr"
            bind:value={companyId}
            placeholder="3fa85f64-5717-4562-b3fc-..."
            class="input"
          />
        </div>
      </div>

      <!-- Car Model + Car Brand -->
      <div class="row">
        <div class="field">
          <label for="drCarModel">CAR MODEL</label>
          <input
            id="drCarModel"
            type="text"
            bind:value={carModel}
            placeholder="e.g. Corolla 2020"
            class="input"
          />
        </div>
        <div class="field">
          <label for="drCarBrand">CAR BRAND</label>
          <input
            id="drCarBrand"
            type="text"
            bind:value={carBrand}
            placeholder="e.g. Toyota"
            class="input"
          />
        </div>
      </div>

      <!-- License Plate -->
      <div class="field" style="max-width: 220px;">
        <label for="drPlate">LICENSE PLATE</label>
        <input
          id="drPlate"
          type="text"
          dir="ltr"
          bind:value={carLicensePlate}
          placeholder="ABC-123"
          class="input"
        />
      </div>

      <!-- Feedback -->
      {#if errorMessage}
        <p class="error">{errorMessage}</p>
      {/if}
      {#if successMessage}
        <p class="success">{successMessage}</p>
      {/if}

      <!-- Submit -->
      <div class="footer">
        <button class="btn-register" on:click={register} disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register Driver'}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f4f4f5;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .page {
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f4f4f5;
    padding: 24px 16px;
    box-sizing: border-box;
  }

  .card {
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    width: 100%;
    max-width: 580px;
    padding: 28px 32px 24px;
    box-sizing: border-box;
  }

  /* ── Header ── */
  .card-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f0f0f0;
  }

  .logo-icon {
    width: 40px;
    height: 40px;
    background: #fff8e6;
    border: 1px solid #f5dfa0;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c9920a;
    flex-shrink: 0;
  }

  .header-text h1 {
    margin: 0 0 2px;
    font-size: 1.1rem;
    font-weight: 700;
    color: #111;
    letter-spacing: -0.3px;
  }

  .header-text p {
    margin: 0;
    font-size: 0.78rem;
    color: #888;
  }

  /* ── Form ── */
  .form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field.full {
    width: 100%;
  }

  label {
    font-size: 0.68rem;
    font-weight: 700;
    color: #999;
    letter-spacing: 0.6px;
  }

  .input {
    border: 1px solid #e4e4e7;
    border-radius: 8px;
    padding: 9px 12px;
    font-size: 0.875rem;
    color: #111;
    background: #fff;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  .input::placeholder {
    color: #bbb;
  }

  .input:focus {
    border-color: #d4a82e;
    box-shadow: 0 0 0 3px rgba(212, 168, 46, 0.12);
  }

  .input:disabled {
    background: #f8f8f8;
    color: #aaa;
  }

  /* ── Footer ── */
  .footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 4px;
  }

  .btn-register {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 9px 20px;
    font-size: 0.875rem;
    font-weight: 600;
    color: #333;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s ease;
  }

  .btn-register:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #bbb;
  }

  .btn-register:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ── Feedback ── */
  .error {
    font-size: 0.82rem;
    color: #dc2626;
    margin: 0;
    padding: 10px 14px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
  }

  .success {
    font-size: 0.82rem;
    color: #16a34a;
    margin: 0;
    padding: 10px 14px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
  }

  /* Responsive */
  @media (max-width: 480px) {
    .card {
      padding: 20px 18px;
    }
    .row {
      grid-template-columns: 1fr;
    }
  }
</style>
