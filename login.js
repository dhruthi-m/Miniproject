/* ==========================================================================
   MindWave Access Portal Client Logic
   ========================================================================== */

const API_BASE = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupPasswordToggles();
  setupSwitchPrompts();
  setupFormValidation();
});

/**
 * Manages tab switching between Login and Create Account
 */
function setupTabs() {
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const formLogin = document.getElementById('form-login');
  const formSignup = document.getElementById('form-signup');

  if (!tabLogin || !tabSignup || !formLogin || !formSignup) return;

  const switchToLogin = () => {
    tabLogin.classList.add('active');
    tabLogin.setAttribute('aria-selected', 'true');
    tabSignup.classList.remove('active');
    tabSignup.setAttribute('aria-selected', 'false');

    formLogin.classList.add('active');
    formSignup.classList.remove('active');
  };

  const switchToSignup = () => {
    tabSignup.classList.add('active');
    tabSignup.setAttribute('aria-selected', 'true');
    tabLogin.classList.remove('active');
    tabLogin.setAttribute('aria-selected', 'false');

    formSignup.classList.add('active');
    formLogin.classList.remove('active');
  };

  tabLogin.addEventListener('click', switchToLogin);
  tabSignup.addEventListener('click', switchToSignup);

  // Store references globally on window to access from quick links
  window.mindwaveAuth = { switchToLogin, switchToSignup };

  // Parse URL search parameters to switch tab on load
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('tab') === 'signup') {
    switchToSignup();
  }
}

/**
 * Handles show/hide toggles for password fields
 */
function setupPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.password-toggle-btn');

  toggleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      const wrapper = btn.closest('.password-field-wrapper');
      if (!wrapper) return;

      const input = wrapper.querySelector('.password-input');
      const eyeOn = btn.querySelector('.eye-on');
      const eyeOff = btn.querySelector('.eye-off');

      if (!input || !eyeOn || !eyeOff) return;

      if (input.type === 'password') {
        input.type = 'text';
        eyeOn.classList.remove('hidden');
        eyeOff.classList.add('hidden');
        btn.setAttribute('aria-label', 'Hide password');
      } else {
        input.type = 'password';
        eyeOn.classList.add('hidden');
        eyeOff.classList.remove('hidden');
        btn.setAttribute('aria-label', 'Show password');
      }
    });
  });
}

/**
 * Handles bottom Switch Prompts ("Create one" / "Login")
 */
function setupSwitchPrompts() {
  const switchToSignupBtn = document.getElementById('switch-to-signup');
  const switchToLoginBtn = document.getElementById('switch-to-login');

  if (switchToSignupBtn) {
    switchToSignupBtn.addEventListener('click', () => {
      if (window.mindwaveAuth && window.mindwaveAuth.switchToSignup) {
        window.mindwaveAuth.switchToSignup();
      }
    });
  }

  if (switchToLoginBtn) {
    switchToLoginBtn.addEventListener('click', () => {
      if (window.mindwaveAuth && window.mindwaveAuth.switchToLogin) {
        window.mindwaveAuth.switchToLogin();
      }
    });
  }
}

/**
 * Shows an error message in the nearest .error-msg element inside a group.
 */
function showError(inputEl, message) {
  const group = inputEl.closest('.input-group');
  if (!group) return;
  const errSpan = group.querySelector('.error-msg');
  if (errSpan) {
    errSpan.textContent = message;
    errSpan.classList.add('active');
    inputEl.classList.add('input-error');
  }
}

/**
 * Clears all error-msg spans within a form.
 */
function clearErrors(formEl) {
  formEl.querySelectorAll('.error-msg').forEach(span => {
    span.textContent = '';
    span.classList.remove('active');
  });
  formEl.querySelectorAll('.input-error').forEach(el => {
    el.classList.remove('input-error');
  });
}

/**
 * Sets a submit button into loading state (or restores it).
 */
function setButtonLoading(btn, loading) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.textContent;
    btn.textContent = 'Please wait…';
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || btn.textContent;
  }
}

/**
 * Handles validation, API calls, and matching feedback
 */
function setupFormValidation() {
  const signupForm = document.getElementById('form-signup');
  const loginForm = document.getElementById('form-login');

  // ── SIGNUP FORM ─────────────────────────────────────────────────────────────
  if (signupForm) {
    const signupUsername = document.getElementById('signup-username');
    const signupEmail = document.getElementById('signup-email');
    const signupPassword = document.getElementById('signup-password');
    const signupConfirmPassword = document.getElementById('signup-confirm-password');
    const pwdMatchError = document.getElementById('pwd-match-error');
    const submitBtn = signupForm.querySelector('button[type="submit"]');

    const validatePasswordsMatch = () => {
      if (signupConfirmPassword.value === '') {
        pwdMatchError.textContent = '';
        pwdMatchError.classList.remove('active');
        return true;
      }

      if (signupPassword.value !== signupConfirmPassword.value) {
        pwdMatchError.textContent = 'Passwords must match';
        pwdMatchError.classList.add('active');
        signupConfirmPassword.classList.add('input-error');
        return false;
      } else {
        pwdMatchError.textContent = '';
        pwdMatchError.classList.remove('active');
        signupConfirmPassword.classList.remove('input-error');
        return true;
      }
    };

    signupPassword.addEventListener('input', validatePasswordsMatch);
    signupConfirmPassword.addEventListener('input', validatePasswordsMatch);

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors(signupForm);

      if (!validatePasswordsMatch()) return;

      const name = signupUsername.value.trim();
      const email = signupEmail.value.trim();
      const password = signupPassword.value;

      // Basic client-side checks
      if (name.length < 4) {
        showError(signupUsername, 'Username must be at least 4 characters');
        return;
      }
      if (!email) {
        showError(signupEmail, 'Email is required');
        return;
      }
      if (password.length < 8) {
        showError(signupPassword, 'Password must be at least 8 characters');
        return;
      }

      setButtonLoading(submitBtn, true);

      try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          showError(signupEmail, data.message || 'Registration failed. Please try again.');
          return;
        }

        //  Registration successful — switch to login tab
        signupForm.reset();
        if (window.mindwaveAuth && window.mindwaveAuth.switchToLogin) {
          window.mindwaveAuth.switchToLogin();
        }

        // Pre-fill email in the login form for convenience
        const loginEmailInput = document.getElementById('login-username');
        if (loginEmailInput) {
          loginEmailInput.value = email;
        }

      } catch (err) {
        showError(signupEmail, 'Cannot reach the server. Please check your connection.');
        console.error('[MindWave] Register error:', err);
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }

  // ── LOGIN FORM ───────────────────────────────────────────────────────────────
  if (loginForm) {
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors(loginForm);

      const email = loginUsernameInput.value.trim();
      const password = loginPasswordInput.value;

      if (!email) {
        showError(loginUsernameInput, 'Email is required');
        return;
      }
      if (!password) {
        showError(loginPasswordInput, 'Password is required');
        return;
      }

      setButtonLoading(submitBtn, true);

      try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          showError(loginUsernameInput, data.message || 'Login failed. Please try again.');
          return;
        }

        //  Login successful — save JWT token and user info
        localStorage.setItem('mindwave_token', data.token);
        if (data.user) {
          localStorage.setItem('mindwave_user', JSON.stringify(data.user));
        }
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || '/dashboard.html';
        window.location.href = redirect;

      } catch (err) {
        showError(loginUsernameInput, 'Cannot reach the server. Please check your connection.');
        console.error('[MindWave] Login error:', err);
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }
}

