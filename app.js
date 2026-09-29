(() => {
  "use strict";

  const STORAGE_KEY = "questvault_waitlist_submissions";
  const config = window.QUESTVAULT_CONFIG || {};
  const configuredEndpoint = typeof config.endpoint === "string" ? config.endpoint.trim() : "";
  const endpoint = configuredEndpoint && configuredEndpoint !== "__WAITLIST_ENDPOINT__" ? configuredEndpoint : "";
  const form = document.querySelector("#waitlist-form");
  const successState = document.querySelector("#success-state");
  const message = document.querySelector("#form-message");
  const resetButton = document.querySelector("#reset-form");
  const emailInput = document.querySelector("#email");
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#site-nav");

  function readSubmissions() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch (_) { return []; }
  }

  function saveSubmission(submission) {
    const current = readSubmissions();
    current.push(submission);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }

  function showSuccess() {
    form.hidden = true;
    successState.hidden = false;
  }

  function clearError() {
    emailInput.removeAttribute("aria-invalid");
    message.textContent = "";
  }

  function resetSubmitButton(submitButton, labelHtml) {
    submitButton.disabled = false;
    submitButton.innerHTML = labelHtml;
  }

  function fail(submitButton, text) {
    message.textContent = text;
    resetSubmitButton(submitButton, 'Try again <span aria-hidden="true">→</span>');
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearError();
      if (!emailInput.validity.valid) {
        emailInput.setAttribute("aria-invalid", "true");
        message.textContent = "Enter a valid work email to join the list.";
        emailInput.focus();
        return;
      }

      // Honeypot: bots fill hidden _gotcha; real users leave it empty.
      const gotcha = form.elements._gotcha;
      if (gotcha && String(gotcha.value || "").trim() !== "") {
        showSuccess();
        return;
      }

      const email = emailInput.value.trim().toLowerCase();
      const data = {
        email,
        _replyto: email,
        updates: form.elements.updates.checked,
        submittedAt: new Date().toISOString(),
        _subject: "QuestVault waitlist signup",
        _template: "table",
        _captcha: "false",
        source: "questvault-waitlist-landing"
      };
      const submitButton = form.querySelector("button[type=submit]");
      submitButton.disabled = true;
      submitButton.textContent = "Joining…";

      if (!endpoint) {
        message.textContent = "Signup service is not configured yet. Please try again later.";
        resetSubmitButton(submitButton, 'Join the list <span aria-hidden="true">→</span>');
        return;
      }

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(data)
        });

        let payload = null;
        try {
          payload = await response.json();
        } catch (_) {
          payload = null;
        }

        // FormSubmit returns JSON like { success: true|false, message: "..." }.
        // Do NOT treat bare HTTP 2xx as proof Bradley received email.
        const apiOk = payload && payload.success === true;
        if (!response.ok || !apiOk) {
          const apiMessage = payload && typeof payload.message === "string" ? payload.message : "";
          if (response.status === 429 || /rate limit/i.test(apiMessage)) {
            fail(submitButton, "Signup service is busy (rate limited). Please try again in a few minutes.");
            return;
          }
          if (/activat|confirm|verify/i.test(apiMessage)) {
            fail(submitButton, "Signup is waiting on FormSubmit activation. The site owner must click the activation email once.");
            return;
          }
          fail(submitButton, apiMessage || "Could not reach the signup service. Please try again in a moment.");
          return;
        }

        try { saveSubmission(data); } catch (_) { /* local backup optional */ }
      } catch (_) {
        fail(submitButton, "Could not reach the signup service. Please try again in a moment.");
        return;
      }
      showSuccess();
    });
  }

  resetButton?.addEventListener("click", () => {
    form.reset();
    form.hidden = false;
    successState.hidden = true;
    clearError();
    emailInput.focus();
  });

  menuToggle?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }));

  const params = new URLSearchParams(window.location.search);
  const checkoutBanner = document.querySelector("#checkout-banner");
  if (checkoutBanner && params.get("checkout") === "success") {
    checkoutBanner.hidden = false;
  }

  const year = document.querySelector("#current-year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
