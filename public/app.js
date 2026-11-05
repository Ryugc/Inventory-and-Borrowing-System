const state = { token: null, role: null, user: null };

const $ = (selector) => document.querySelector(selector);
const notice = $("#notice");
const httpAlert = $("#httpAlert");

function showHttpAlert(status, message) {
  httpAlert.textContent = `HTTP ${status} Error: ${message}`;
  httpAlert.classList.remove("hidden");
}

function showNotice(message, isError = false) {
  notice.textContent = message;
  notice.classList.toggle("error", isError);
  notice.classList.remove("hidden");
  window.clearTimeout(showNotice.timeout);
  showNotice.timeout = window.setTimeout(() => notice.classList.add("hidden"), 4000);
}

function handleApiError(error) {
  if (!String(error.message).startsWith("HTTP ")) {
    handleApiError(error);
  }
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers["Content-Type"] = "application/json";
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(path, { ...options, headers });
  let body = null;
  try { body = await response.json(); } catch (_) {}
  if (!response.ok) {
    const message = String(body?.error || `Request failed (${response.status})`);
    showHttpAlert(response.status, message);
    throw new Error(`HTTP ${response.status} Error: ${message}`);
  }
  return body;
}

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString();
}

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = String(value ?? "");
  return element.innerHTML;
}

function switchView(viewName) {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewName));
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.add("hidden"));
  $(`#${viewName === "catalog" ? "catalog" : viewName === "requests" ? "requests" : "loans"}Panel`)?.classList.remove("hidden");
}

async function loadCatalog() {
  try {
    const assets = await api("/assets");
    $("#catalogGrid").innerHTML = assets.map((asset) => {
      const available = asset.status === "AVAILABLE";
      return `
        <article class="asset-card">
          <span class="status ${available ? "status-available" : "status-other"}">${escapeHtml(asset.status)}</span>
          <h3>${escapeHtml(asset.name)}</h3>
          <p>${escapeHtml(asset.assetTag)} · ${escapeHtml(asset.category)}</p>
          ${state.role === "BORROWER"
            ? `<button class="button request-button" type="button" data-id="${escapeHtml(asset.id)}" ${available ? "" : "disabled"}>Request</button>`
            : ""}
        </article>`;
    }).join("");
  } catch (error) {
    handleApiError(error);
  }
}

async function loadRequests() {
  try {
    const requests = await api("/borrow-requests/my");
    $("#requestList").innerHTML = requests.length ? requests.map((request) => `
      <article class="list-item">
        <div>
          <strong>${escapeHtml(request.assetId)}</strong>
          <p>Requested ${formatDate(request.requestDate)}</p>
        </div>
        <span class="status status-other">${escapeHtml(request.status)}</span>
      </article>`).join("") : `<p class="muted">No borrow requests yet.</p>`;
  } catch (error) {
    handleApiError(error);
  }
}

async function loadLoans() {
  try {
    const loans = await api("/loans/active");
    $("#loanList").innerHTML = loans.length ? loans.map((loan) => `
      <article class="list-item">
        <div>
          <strong>${escapeHtml(loan.assetId)}</strong>
          <p>Loan ${escapeHtml(loan.id)} · Due ${formatDate(loan.dueDate)}</p>
        </div>
        <button class="button button-secondary return-button" type="button" data-id="${escapeHtml(loan.id)}">Return</button>
      </article>`).join("") : `<p class="muted">No active loans.</p>`;
  } catch (error) {
    handleApiError(error);
  }
}

async function loadPendingRequests() {
  if (state.role !== "CUSTODIAN") return;
  try {
    const requests = await api("/api/borrow-requests/pending");
    $("#pendingRequestList").innerHTML = requests.length ? requests.map((request) => `
      <article class="list-item">
        <div>
          <strong>${escapeHtml(request.asset.name)} · ${escapeHtml(request.asset.assetTag)}</strong>
          <p>Request ${escapeHtml(request.id)}</p>
          <p>Borrower: ${escapeHtml(request.borrower.email)}</p>
          <p>Submitted: ${formatDate(request.requestDate)}</p>
        </div>
        <button class="button approve-button" type="button" data-id="${escapeHtml(request.id)}">Approve / Checkout</button>
      </article>`).join("") : `<p class="muted">No pending borrow requests.</p>`;
  } catch (error) {
    handleApiError(error);
  }
}

function enterApp(session) {
  state.token = session.token;
  state.role = session.role;
  state.user = session.user;
  $("#loginView").classList.add("hidden");
  $("#appView").classList.remove("hidden");
  $("#logoutButton").classList.remove("hidden");
  $("#userName").textContent = session.user.email;
  $("#roleBadge").textContent = session.role;
  $("#borrowerTab").classList.toggle("hidden", session.role !== "BORROWER");
  $("#custodianTab").classList.toggle("hidden", session.role !== "CUSTODIAN");
  switchView("catalog");
  loadCatalog();
  if (session.role === "CUSTODIAN") {
    loadPendingRequests();
    loadLoans();
  }
}

$("#loginForm").addEventListener("submit", async (event) => {
  event.preventEventDefault?.();
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    const session = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") })
    });
    enterApp(session);
    showNotice("Signed in successfully.");
  } catch (error) {
    handleApiError(error);
  }
});

document.querySelectorAll(".quick-login button").forEach((button) => {
  button.addEventListener("click", () => {
    $("#email").value = button.dataset.email;
    $("#password").value = button.dataset.password;
  });
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    switchView(tab.dataset.view);
    if (tab.dataset.view === "requests") loadRequests();
    if (tab.dataset.view === "loans") {
      loadPendingRequests();
      loadLoans();
    }
    if (tab.dataset.view === "catalog") loadCatalog();
  });
});

$("#catalogGrid").addEventListener("click", async (event) => {
  const button = event.target.closest(".request-button");
  if (!button) return;
  try {
    const request = await api("/borrow-requests", { method: "POST", body: JSON.stringify({ assetId: button.dataset.id }) });
    showNotice(`Request created: ${request.id}`);
    await loadCatalog();
    await loadRequests();
  } catch (error) {
    handleApiError(error);
  }
});

$("#checkoutForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const requestId = form.get("requestId");
  const dueDate = form.get("dueAt");
  try {
    await api(`/borrow-requests/${encodeURIComponent(requestId)}/checkout`, {
      method: "POST",
      body: JSON.stringify({ dueAt: `${dueDate}T00:00:00.000Z` })
    });
    showNotice("Checkout completed.");
    await loadCatalog();
    await loadPendingRequests();
    await loadLoans();
  } catch (error) {
    handleApiError(error);
  }
});

$("#pendingRequestList").addEventListener("click", (event) => {
  const button = event.target.closest(".approve-button");
  if (!button) return;
  $("#requestId").value = button.dataset.id;
  setDefaultDueDate();
  $("#requestId").focus();
  showNotice("Request selected. Review the due date and confirm Checkout.");
});

$("#loanList").addEventListener("click", async (event) => {
  const button = event.target.closest(".return-button");
  if (!button) return;
  try {
    await api(`/loans/${encodeURIComponent(button.dataset.id)}/return`, {
      method: "POST",
      body: JSON.stringify({ returnCondition: "Good" })
    });
    showNotice("Loan returned successfully.");
    await loadCatalog();
    await loadLoans();
  } catch (error) {
    handleApiError(error);
  }
});

$("#logoutButton").addEventListener("click", () => {
  state.token = null;
  state.role = null;
  state.user = null;
  $("#appView").classList.add("hidden");
  $("#logoutButton").classList.add("hidden");
  $("#loginView").classList.remove("hidden");
});

$("#refreshCatalogButton").addEventListener("click", loadCatalog);
$("#refreshRequestsButton").addEventListener("click", loadRequests);
$("#refreshPendingButton").addEventListener("click", loadPendingRequests);

function setDefaultDueDate() {
  const dueAt = $("#dueAt");
  const fourteenDays = new Date();
  fourteenDays.setDate(fourteenDays.getDate() + 14);
  dueAt.value = fourteenDays.toISOString().slice(0, 10);
}

setDefaultDueDate();
