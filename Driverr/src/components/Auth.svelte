<script lang="ts">
  import { currentView, phoneNumber, fetchProfile, driverProfile, isAuthenticated, navigate } from '../stores/appStore';
  import { authApi, setToken } from '../lib/api';
  import { onMount } from 'svelte';
  
  let tempPhone = '';
  let countryCode = '+964';
  let otpInputs: string[] = ['', '', '', '', '', ''];
  let inputsRef: HTMLInputElement[] = [];
  
  let isLoading = false;
  let errorMessage = '';
  
  // Registration data
  let driverName = '';

  async function sendCode() {
    if (tempPhone.length >= 7) {
      isLoading = true;
      errorMessage = '';
      $phoneNumber = `${countryCode}${tempPhone}`;
      
      try {
        await authApi.requestOtp($phoneNumber);
        $currentView = 'otp';
      } catch (err: any) {
        errorMessage = err.message || 'حدث خطأ غير متوقع';
      } finally {
        isLoading = false;
      }
    }
  }
  
  async function verifyCode() {
    const code = otpInputs.join('');
    if (code.length === 6) {
      isLoading = true;
      errorMessage = '';
      try {
        const res = await authApi.verifyOtp($phoneNumber, code);
        const token = res.token || res.data?.token;
        if (token) {
          setToken(token);
          // Check if profile exists
          const profile = await fetchProfile();
          if (profile && profile.name) {
            $isAuthenticated = true;
            $currentView = 'offers';
          } else {
            // New driver? Go to registration
            $currentView = 'register';
          }
        }
      } catch (err: any) {
        errorMessage = err.message || 'رمز التحقق غير صحيح';
      } finally {
        isLoading = false;
      }
    }
  }

  async function completeRegistration() {
    if (driverName.trim().length >= 3) {
      isLoading = true;
      try {
        // Calling the endpoint that the backend developer will implement
        const res = await authApi.register({
          name: driverName,
          phoneNumber: $phoneNumber
        });

        // In case register returns a token, update it
        const token = res.token || res.data?.token;
        if (token) {
          setToken(token);
        }

        // Fetch the fresh profile to confirm successful registration
        await fetchProfile();
        
        $isAuthenticated = true;
        $currentView = 'offers';
      } catch (err: any) {
        errorMessage = err.message || 'تعذر استكمال التسجيل';
      } finally {
        isLoading = false;
      }
    } else {
      errorMessage = 'يرجى إدخال اسمك الحقيقي';
    }
  }
  
  function handleOtpInput(index: number, event: Event) {
    const target = event.target as HTMLInputElement;
    let val = target.value;
    
    if (val.length > 1) {
      val = val.slice(0, 1);
      otpInputs[index] = val;
    }
    
    if (val !== '' && index < 5) {
      inputsRef[index + 1].focus();
    }
  }
  
  function handleOtpKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && otpInputs[index] === '' && index > 0) {
      inputsRef[index - 1].focus();
    }
  }
</script>

<div class="auth-container animate-fade container">
  {#if $currentView === 'auth'}
    <!-- Phone Entry Screen -->
    <div class="driver-auth-header">
      <div class="logo-badge">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h10"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
      </div>
      <h1 class="brand-title">TransPay</h1>
      <p class="driver-caption">تسجيل دخول السائق</p>
    </div>
    
    <div class="form-group phone-group">
      <label class="phone-label" for="driverPhoneAuth">رقم الموبايل</label>
      <div class="phone-input-wrapper">
        <div class="phone-icon-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2" ry="2"/><path d="M11 18h2"/></svg>
        </div>
        <input 
          id="driverPhoneAuth"
          dir="ltr"
          type="tel" 
          bind:value={tempPhone}
          placeholder="964 7801234567+"
          class="input-field phone-input"
          inputmode="numeric"
        />
        <select bind:value={countryCode} class="country-select" dir="ltr">
          <option value="+964">+964</option>
        </select>
      </div>
      {#if errorMessage}
        <p class="error-msg">{errorMessage}</p>
      {/if}
    </div>
    
    <div class="action-footer">
      <button class="btn btn-primary" on:click={sendCode} disabled={tempPhone.length < 7 || isLoading}>
        {isLoading ? 'جاري الإرسال...' : 'إرسال الرمز'}
        {#if !isLoading}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: scaleX(-1);"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        {/if}
      </button>
      <p class="legal-note">
        بالنقر على <strong>إرسال الرمز</strong> فإنك توافق على
        <button class="inline-link" type="button">الشروط والأحكام</button>
        و
        <button class="inline-link" type="button">سياسة الخصوصية</button>
      </p>
    </div>

  {:else if $currentView === 'otp'}
    <!-- OTP Verification Screen -->
    <div class="auth-header">
      <button class="back-btn" on:click={() => $currentView = 'auth'}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
      <div class="logo-placeholder small">
         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <h1>رمز التحقق</h1>
      <p>لقد أرسلنا رمزاً مكوناً من 6 أرقام إلى <strong><span dir="ltr">{$phoneNumber}</span></strong></p>
    </div>
    
    <div class="otp-container" dir="ltr">
      {#each otpInputs as _, i}
        <input
          bind:this={inputsRef[i]}
          bind:value={otpInputs[i]}
          on:input={(e) => handleOtpInput(i, e)}
          on:keydown={(e) => handleOtpKeydown(i, e)}
          type="text"
          inputmode="numeric"
          maxlength="1"
          class="otp-box"
        />
      {/each}
    </div>
    
    {#if errorMessage}
      <p class="error-msg" style="text-align: center;">{errorMessage}</p>
    {/if}
    
    <div class="resend-wrapper">
      <p>لم تستلم الرمز؟ <button class="btn-ghost-small" on:click={sendCode}>أعد الإرسال</button></p>
    </div>
    
    <div class="action-footer">
      <button class="btn btn-primary" on:click={verifyCode} disabled={otpInputs.join('').length < 6 || isLoading}>
        {isLoading ? 'جاري التحقق...' : 'تحقق وتسجيل الدخول'}
      </button>
    </div>

  {:else if $currentView === 'register'}
    <!-- New Driver Registration -->
    <div class="auth-header">
      <div class="logo-placeholder">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <h1>إكمال الملف الشخصي</h1>
      <p>يرجى إدخال اسمك الكامل لبدء استلام الطلبات</p>
    </div>

    <div class="form-group">
      <label for="driverName">الاسم الكامل</label>
      <input 
        id="driverName"
        type="text" 
        bind:value={driverName}
        placeholder="مثال: محمد علي"
        class="input-field"
      />
      {#if errorMessage}
        <p class="error-msg">{errorMessage}</p>
      {/if}
    </div>

    <div class="form-group">
        <label for="driverPhone">رقم الهاتف</label>
        <input 
          id="driverPhone"
          type="text" 
          value={$phoneNumber}
          disabled
          class="input-field"
          style="background-color: var(--bg-tertiary); color: var(--text-muted);"
        />
      </div>

    <div class="action-footer">
      <button class="btn btn-primary" on:click={completeRegistration} disabled={driverName.length < 3 || isLoading}>
        {isLoading ? 'جاري الحفظ...' : 'ابدأ العمل الآن'}
        {#if !isLoading}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: scaleX(-1);"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        {/if}
      </button>
    </div>
  {/if}
</div>

<style>
  .auth-container {
    padding: var(--spacing-5);
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: calc(95vh - 20px);
    justify-content: flex-start;
    padding-top: 84px;
  }
  
  .auth-header {
    text-align: center;
    margin-bottom: var(--spacing-8);
    position: relative;
  }
  
  .logo-placeholder {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, var(--primary-container), var(--primary));
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--on-primary);
    margin: 0 auto var(--spacing-5);
    box-shadow: 0 8px 16px rgba(250, 196, 69, 0.4);
  }

  .logo-placeholder.small {
    width: 56px;
    height: 56px;
    border-radius: 16px;
  }
  
  .back-btn {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    background: var(--bg-tertiary);
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .phone-input-wrapper {
    display: flex;
    gap: var(--spacing-2);
    align-items: center;
    background: var(--bg-secondary);
    border: 1px solid #ece3d8;
    border-radius: 14px;
    padding: 4px 10px;
  }
  
  .country-select {
    background-color: transparent;
    border: none;
    color: var(--text-primary);
    padding: var(--spacing-2);
    border-radius: 10px;
    font-family: var(--font-family);
    min-width: 64px;
    outline: none;
    text-align: center;
    font-weight: 500;
    font-size: 0.9rem;
  }
  
  .phone-input {
    flex: 1;
    font-size: 0.95rem;
    letter-spacing: 0.2px;
    text-align: left;
    font-family: inherit;
    border: none;
    box-shadow: none;
    padding-right: 0;
    padding-left: 0;
    background: transparent;
  }
  
  .phone-input:focus {
    box-shadow: none;
  }
  
  .error-msg {
    color: var(--danger);
    font-size: 0.85rem;
    margin-top: 8px;
    font-weight: 500;
  }
  
  .otp-container {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: var(--spacing-6);
  }
  
  .otp-box {
    width: 15%;
    aspect-ratio: 1/1.2;
    background-color: var(--bg-secondary);
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--border-radius-md);
    color: var(--text-primary);
    font-size: 1.5rem;
    font-weight: 700;
    text-align: center;
    transition: all 0.2s ease;
  }
  
  .otp-box:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: var(--focus-ring);
    transform: translateY(-4px);
  }
  
  .resend-wrapper {
    text-align: center;
    margin-bottom: var(--spacing-6);
  }
  
  .btn-ghost-small {
    background: none;
    border: none;
    color: var(--primary-dark);
    font-weight: 700;
    cursor: pointer;
    font-family: var(--font-family);
    text-decoration: underline;
  }
  
  .action-footer {
    margin-top: auto;
    padding-bottom: 20px;
  }

  .driver-auth-header {
    text-align: center;
    margin-bottom: 52px;
  }

  .logo-badge {
    width: 44px;
    height: 44px;
    border-radius: 13px;
    margin: 0 auto 12px;
    background: #fff3d6;
    color: #d6a229;
    border: 1px solid #f4deb0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .brand-title {
    font-size: 2rem;
    font-weight: 900;
    margin-bottom: 2px;
    letter-spacing: -0.8px;
    color: #161616;
  }

  .driver-caption {
    font-size: 0.8rem;
    color: #28231c;
    margin-bottom: 0;
  }

  .phone-label {
    font-size: 0.82rem;
    color: #56504a;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .phone-icon-box {
    width: 26px;
    height: 26px;
    color: #8b8176;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .phone-group {
    margin-bottom: 16px;
  }

  .legal-note {
    margin-top: 14px;
    text-align: center;
    color: #72695f;
    font-size: 0.7rem;
    line-height: 1.8;
  }

  .inline-link {
    border: none;
    background: none;
    color: #473f35;
    font-size: 0.7rem;
    font-weight: 700;
    text-decoration: underline;
    cursor: pointer;
    font-family: var(--font-family);
    padding: 0;
    margin: 0 2px;
  }
</style>
