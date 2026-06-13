document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const authMessage = document.getElementById('authMessage');
  const otpModal = document.getElementById('otpModal');
  const otpForm = document.getElementById('otpForm');
  const otpCode = document.getElementById('otpCode');
  const otpMessage = document.getElementById('otpMessage');
  const otpDescription = document.getElementById('otpDescription');
  const otpSubmitButton = otpForm ? otpForm.querySelector('button[type="submit"]') : null;
  const resendOtpButton = document.getElementById('resendOtpButton');
  const closeOtpModal = document.getElementById('closeOtpModal');
  const signupRole = document.getElementById('signupRole');
  const panGroup = document.getElementById('panGroup');
  const signupPan = document.getElementById('signupPan');
  const googleButton = document.getElementById('googleSignInButton');
  const googleHint = document.getElementById('googleAuthHint');

  let pendingOtp = null;
  let resendCooldownUntil = 0;
  let resendTimer = null;
  const RESEND_COOLDOWN_MS = 30000;

  const showMessage = (message, type = 'success') => {
    if (!authMessage) return;
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
  };

  const showOtpMessage = (message, type = 'success') => {
    if (!otpMessage) return;
    otpMessage.textContent = message;
    otpMessage.className = `auth-message ${type}`;
  };

  const showGoogleMessage = (message, type = 'success') => {
    if (!googleHint) return;
    googleHint.textContent = message;
    googleHint.className = `auth-message ${type}`;
  };

  const getResendButtonLabel = () => {
    const remaining = Math.max(0, resendCooldownUntil - Date.now());
    return remaining > 0 ? `Resend OTP (${Math.ceil(remaining / 1000)}s)` : 'Resend OTP';
  };

  const getResendCooldownMessage = () => {
    const remaining = Math.max(0, resendCooldownUntil - Date.now());
    return remaining > 0
      ? `Please wait ${Math.ceil(remaining / 1000)} seconds before resending.`
      : 'You can resend the code now.';
  };

  const updateResendButton = () => {
    if (!resendOtpButton) return;
    const remaining = Math.max(0, resendCooldownUntil - Date.now());
    resendOtpButton.textContent = getResendButtonLabel();
    resendOtpButton.disabled = !pendingOtp || remaining > 0;

    if (resendTimer) {
      window.clearInterval(resendTimer);
      resendTimer = null;
    }

    if (pendingOtp && remaining > 0) {
      resendTimer = window.setInterval(() => {
        const left = Math.max(0, resendCooldownUntil - Date.now());
        resendOtpButton.textContent = getResendButtonLabel();
        resendOtpButton.disabled = !pendingOtp || left > 0;

        if (left <= 0 && resendTimer) {
          window.clearInterval(resendTimer);
          resendTimer = null;
          resendOtpButton.textContent = 'Resend OTP';
          resendOtpButton.disabled = !pendingOtp;
        }
      }, 250);
    }
  };

  const startResendCooldown = () => {
    resendCooldownUntil = Date.now() + RESEND_COOLDOWN_MS;
    updateResendButton();
  };

  const clearResendState = () => {
    resendCooldownUntil = 0;
    if (resendTimer) {
      window.clearInterval(resendTimer);
      resendTimer = null;
    }
    updateResendButton();
  };

  const redirectAfterLogin = (user) => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || 'index.html';

    if (user.role === 'seller') {
      window.location.href = 'seller.html';
      return;
    }

    window.location.href = next;
  };

  const setOtpModalOpen = (isOpen) => {
    if (!otpModal) return;
    otpModal.style.display = isOpen ? 'flex' : 'none';
    if (!isOpen) {
      pendingOtp = null;
      clearResendState();
      if (otpCode) otpCode.value = '';
      showOtpMessage('');
    } else {
      updateResendButton();
    }
  };

  const updateSellerFields = () => {
    const isSeller = signupRole && signupRole.value === 'seller';
    if (panGroup) panGroup.style.display = isSeller ? 'flex' : 'none';
    if (signupPan) signupPan.required = Boolean(isSeller);
  };

  const requestOtp = async (endpoint, payload, purpose) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Unable to start ${purpose}`);
    return data;
  };

  const verifyOtp = async (endpoint, payload) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'OTP verification failed');
    return data;
  };

  const beginLogin = async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    try {
      showMessage('Sending OTP to your email...');
      const data = await requestOtp('/api/auth/login/request-otp', { email, password }, 'login');
      pendingOtp = {
        mode: 'login',
        challengeId: data.challengeId,
        delivery: data.delivery,
        endpoint: '/api/auth/login/request-otp',
        payload: { email, password }
      };
      if (otpDescription) {
        otpDescription.textContent = `We have sent a 6-digit OTP code to ${data.delivery}.`;
      }
      if (otpSubmitButton) {
        otpSubmitButton.textContent = 'Verify & Login';
      }
      setOtpModalOpen(true);
      startResendCooldown();
      showOtpMessage('');
      showMessage(`OTP sent to ${data.delivery}.`, 'success');
      if (otpCode) otpCode.focus();
    } catch (error) {
      showMessage(error.message || 'Could not log in.', 'error');
    }
  };

  const beginSignup = async (event) => {
    event.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;
    const role = signupRole ? signupRole.value : 'customer';
    const mobile = document.getElementById('signupMobile').value.trim();
    const pan = signupPan ? signupPan.value.trim() : '';

    if (!name || !email || !password || !mobile) {
      showMessage('Please fill in all required fields.', 'error');
      return;
    }

    if (password.length < 6) {
      showMessage('Password must be at least 6 characters.', 'error');
      return;
    }

    if (role === 'seller' && !pan) {
      showMessage('Seller accounts require a PAN number.', 'error');
      return;
    }

    try {
      showMessage('Sending verification OTP...');
      const data = await requestOtp('/api/auth/signup/request-otp', { name, email, password, role, mobile, pan }, 'signup');
      pendingOtp = {
        mode: 'signup',
        challengeId: data.challengeId,
        delivery: data.delivery,
        endpoint: '/api/auth/signup/request-otp',
        payload: { name, email, password, role, mobile, pan }
      };
      if (otpDescription) {
        otpDescription.textContent = `We have sent a 6-digit OTP code to ${data.delivery}.`;
      }
      if (otpSubmitButton) {
        otpSubmitButton.textContent = 'Verify & Create Account';
      }
      setOtpModalOpen(true);
      startResendCooldown();
      showOtpMessage('');
      showMessage(`OTP sent to ${data.delivery}.`, 'success');
      if (otpCode) otpCode.focus();
    } catch (error) {
      showMessage(error.message || 'Could not create account.', 'error');
    }
  };

  const completeOtp = async (event) => {
    event.preventDefault();

    if (!pendingOtp) {
      showOtpMessage('Start login or sign up again.', 'error');
      return;
    }

    const code = otpCode ? otpCode.value.trim() : '';
    if (!code) {
      showOtpMessage('Enter the 6-digit code.', 'error');
      return;
    }

    const endpoint = pendingOtp.mode === 'login'
      ? '/api/auth/login/verify'
      : '/api/auth/signup/verify';

    try {
      const data = await verifyOtp(endpoint, {
        challengeId: pendingOtp.challengeId,
        otp: code
      });

      PetShopAuth.saveSession(data.user, data.token);
      setOtpModalOpen(false);
      showMessage(pendingOtp.mode === 'login' ? 'Login successful. Redirecting…' : 'Account created. Redirecting…');
      setTimeout(() => redirectAfterLogin(data.user), 400);
    } catch (error) {
      showOtpMessage(error.message || 'Could not verify OTP.', 'error');
    }
  };

  const resendOtp = async () => {
    if (!pendingOtp) {
      showOtpMessage('Start login or sign up again.', 'error');
      return;
    }

    if (Date.now() < resendCooldownUntil) {
      showOtpMessage(getResendCooldownMessage(), 'error');
      return;
    }

    try {
      showOtpMessage('Resending OTP...');
      const data = await requestOtp(pendingOtp.endpoint, pendingOtp.payload, pendingOtp.mode);
      pendingOtp.challengeId = data.challengeId;
      pendingOtp.delivery = data.delivery;
      if (otpDescription) {
        otpDescription.textContent = `We have sent a 6-digit OTP code to ${data.delivery}.`;
      }
      startResendCooldown();
      showOtpMessage(`OTP resent to ${data.delivery}.`, 'success');
      if (otpCode) otpCode.focus();
    } catch (error) {
      showOtpMessage(error.message || 'Could not resend OTP.', 'error');
    }
  };

  const handleGoogleCredential = async (credential) => {
    try {
      showGoogleMessage('Signing in with Google...');
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Google sign-in failed');

      PetShopAuth.saveSession(data.user, data.token);
      showGoogleMessage('Google sign-in successful. Redirecting...');
      setTimeout(() => redirectAfterLogin(data.user), 400);
    } catch (error) {
      showGoogleMessage(error.message || 'Could not sign in with Google.', 'error');
    }
  };

  const loadGoogleSignIn = async () => {
    if (!googleButton || !googleHint) return;

    try {
      const response = await fetch('/api/config/google-client-id');
      const data = await response.json();

      if (!data.googleConfigured || !data.googleClientId) {
        showGoogleMessage('Google sign-in is not configured on this server.', 'error');
        googleButton.style.display = 'none';
        return;
      }

      const waitForGoogle = () => new Promise((resolve) => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
          resolve(window.google.accounts.id);
          return;
        }

        const startedAt = Date.now();
        const timer = window.setInterval(() => {
          if (window.google && window.google.accounts && window.google.accounts.id) {
            window.clearInterval(timer);
            resolve(window.google.accounts.id);
          } else if (Date.now() - startedAt > 5000) {
            window.clearInterval(timer);
            resolve(null);
          }
        }, 50);
      });

      const googleAccounts = await waitForGoogle();
      if (!googleAccounts) {
        showGoogleMessage('Google sign-in library did not load.', 'error');
        return;
      }

      googleAccounts.initialize({
        client_id: data.googleClientId,
        callback: (credentialResponse) => {
          if (credentialResponse && credentialResponse.credential) {
            handleGoogleCredential(credentialResponse.credential);
          }
        }
      });

      googleAccounts.renderButton(googleButton, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'signin_with',
        shape: 'pill'
      });
      if (data.hostedDomain) {
        showGoogleMessage(`Allowed Google domain: ${data.hostedDomain}.`);
      } else {
        showGoogleMessage('Sign in with Google using the button below.');
      }
    } catch (error) {
      googleButton.style.display = 'none';
      showGoogleMessage('Unable to load Google sign-in.', 'error');
    }
  };

  if (signupRole) {
    signupRole.addEventListener('change', updateSellerFields);
    updateSellerFields();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', beginLogin);
  }

  if (signupForm) {
    signupForm.addEventListener('submit', beginSignup);
  }

  if (otpForm) {
    otpForm.addEventListener('submit', completeOtp);
  }

  if (closeOtpModal) {
    closeOtpModal.addEventListener('click', () => setOtpModalOpen(false));
  }

  if (resendOtpButton) {
    resendOtpButton.addEventListener('click', resendOtp);
    updateResendButton();
  }

  if (otpModal) {
    otpModal.addEventListener('click', (event) => {
      if (event.target === otpModal) {
        setOtpModalOpen(false);
      }
    });
  }

  loadGoogleSignIn();
});
