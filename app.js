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

      const data = {
        email: emailInput.value.trim().toLowerCase(),
        updates: form.elements.updates.checked,
        submittedAt: new Date().toISOString()
      };
      const submitButton = form.querySelector("button[type=submit]");
      submitButton.disabled = true;
      submitButton.textContent = "Joining…";

      // Static MVP behavior: retain a local copy even with no configured endpoint.
      try { saveSubmission(data); } catch (_) {
        message.textContent = "Your browser blocked local storage. Please try again with storage enabled.";
        submitButton.disabled = false;
        submitButton.innerHTML = 'Join the list <span aria-hidden="true">→</span>';
        return;
      }

      // Optional production endpoint. Set window.QUESTVAULT_CONFIG.endpoint at build time.
      if (endpoint) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(data)
          });
          if (!response.ok) throw new Error("Endpoint rejected submission");
        } catch (_) {
          // The local submission is retained; do not expose endpoint details to visitors.
          message.textContent = "Saved locally. We could not reach the signup service just now.";
          submitButton.disabled = false;
          submitButton.innerHTML = 'Try again <span aria-hidden="true">→</span>';
          return;
        }
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

  const year = document.querySelector("#current-year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
