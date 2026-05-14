(function () {
  const data = window.TYBACHA_DATA;
  const page = document.body.dataset.page || "login";
  const storageKey = "tybacha_state";
  const sessionKey = "tybacha_session";

  const routes = [
    { id: "dashboard", label: "Dashboard", href: "dashboard.html", permission: "dashboard:view" },
    { id: "users", label: "Usuarios", href: "users.html", permission: "users:manage" },
    { id: "roles", label: "Roles y permisos", href: "roles.html", permission: "roles:manage" },
    { id: "profile", label: "Perfil", href: "profile.html", permission: "dashboard:view" },
    { id: "adults", label: "Adultos mayores", href: "adults.html", permission: "adults:assigned" },
    { id: "adultDetail", label: "Ficha integral", href: "adult-detail.html", permission: "adults:assigned" },
    { id: "caregivers", label: "Cuidadores", href: "caregivers.html", permission: "caregivers:view" },
    { id: "sft", label: "Pruebas SFT", href: "sft.html", permission: "sft:manage" },
    { id: "plans", label: "Planes", href: "plans.html", permission: "plans:view" },
    { id: "tracking", label: "Seguimiento", href: "tracking.html", permission: "tracking:own" },
    { id: "alerts", label: "Alertas", href: "alerts.html", permission: "alerts:own" },
    { id: "reports", label: "Reportes", href: "reports.html", permission: "reports:view" },
    { id: "consents", label: "Consentimientos", href: "consents.html", permission: "consents:view" },
    { id: "audit", label: "Auditoria", href: "audit.html", permission: "audit:view" },
    { id: "settings", label: "Configuracion", href: "settings.html", permission: "settings:manage" }
  ];

  const titles = {
    dashboard: "Dashboard principal",
    users: "Gestion de usuarios",
    roles: "Roles y permisos",
    profile: "Perfil de usuario",
    adults: "Gestion de adultos mayores",
    adultDetail: "Ficha integral",
    caregivers: "Gestion de cuidadores",
    sft: "Pruebas SFT",
    plans: "Planes de ejercicio",
    tracking: "Seguimiento y monitoreo",
    alerts: "Alertas y notificaciones",
    reports: "Reportes de progreso",
    consents: "Consentimientos",
    audit: "Auditoria",
    settings: "Configuracion del sistema"
  };

  const state = loadState();
  const session = loadSession();

  if (page === "login") {
    renderLogin();
    return;
  }

  if (page === "register") {
    renderRegister();
    return;
  }

  if (!session) {
    window.location.href = "login.html";
    return;
  }

  const sessionUser = state.users.find((user) => user.id === session.userId);
  if (!sessionUser || sessionUser.role === "older_adult") {
    localStorage.removeItem(sessionKey);
    sessionStorage.removeItem(sessionKey);
    window.location.href = "login.html";
    return;
  }

  renderShell();
  routePage();

  function loadState() {
    const saved = localStorage.getItem(storageKey);
    const loaded = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(data));
    loaded.users = loaded.users
      .filter((user) => user.role !== "older_adult")
      .map((user) => ({ photoUrl: "", ...user }));
    loaded.caregivers = loaded.caregivers.map((caregiver) => ({ photoUrl: "", ...caregiver }));
    loaded.olderAdults = loaded.olderAdults.map((adult) => ({ appAccess: "Sin acceso", photoUrl: "", ...adult }));
    loaded.plans = loaded.plans.map((plan) => ({
      ...plan,
      exercises: plan.exercises.map((exercise) => ({
        compliance: exercise.status === "Completado" ? 100 : exercise.status === "Omitido" ? 0 : 0,
        observations: "",
        requirement: "",
        ...exercise
      }))
    }));
    return loaded;
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function loadSession() {
    const saved = localStorage.getItem(sessionKey) || sessionStorage.getItem(sessionKey);
    return saved ? JSON.parse(saved) : null;
  }

  function setSession(user, remember) {
    const payload = { userId: user.id, token: "mock-jwt-" + Date.now(), remember: Boolean(remember) };
    const target = remember ? localStorage : sessionStorage;
    localStorage.removeItem(sessionKey);
    sessionStorage.removeItem(sessionKey);
    target.setItem(sessionKey, JSON.stringify(payload));
  }

  function currentUser() {
    return state.users.find((user) => user.id === session.userId) || state.users[0];
  }

  function roleOf(user) {
    return state.roles.find((role) => role.id === user.role);
  }

  function can(permission) {
    const role = roleOf(currentUser());
    if (!role) return false;
    if (role.permissions.includes(permission)) return true;
    const [area, action] = permission.split(":");
    if (role.permissions.some((item) => item.startsWith(area + ":manage"))) return true;
    if (action === "view") return role.permissions.some((item) => item.startsWith(area + ":"));
    return false;
  }

  function fullName(adult) {
    return adult.firstName + " " + adult.lastName;
  }

  function adultById(id) {
    return state.olderAdults.find((adult) => adult.id === Number(id));
  }

  function status(text) {
    const slug = String(text || "").toLowerCase().replace(/\s+/g, "-");
    return `<span class="status ${slug}">${escapeHtml(text)}</span>`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initials(name) {
    return String(name || "TY")
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  function personPhoto(src, name, extraClass = "") {
    const safeClass = extraClass ? " " + extraClass : "";
    if (src) {
      return `<div class="photo${safeClass}"><img src="${escapeHtml(src)}" alt="Foto de ${escapeHtml(name)}"></div>`;
    }
    return `<div class="photo${safeClass}" aria-label="Iniciales de ${escapeHtml(name)}">${escapeHtml(initials(name))}</div>`;
  }

  function readPhotoFile(input) {
    const file = input?.files?.[0];
    if (!file) return Promise.resolve("");
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function photoField(id, label) {
    return `<div class="field full"><label for="${id}">${label}</label><input id="${id}" type="file" accept="image/*"></div>`;
  }

  function toast(message) {
    const old = document.querySelector(".toast");
    if (old) old.remove();
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 3200);
  }

  function renderLogin() {
    document.body.className = "auth-page";
    document.body.innerHTML = `
      <section class="auth-panel">
        <div class="brand">
          <div class="brand-mark">TY</div>
          <div><strong>Tybacha</strong><span>Gestion, seguimiento y monitoreo</span></div>
        </div>
        <h1>Cuidado funcional con seguimiento claro.</h1>
        <p>Administra adultos mayores, pruebas SFT, planes personalizados, alertas, reportes y auditoria desde un flujo unificado.</p>
        ${copyright()}
      </section>
      <main class="auth-card">
        <h1>Iniciar sesion</h1>
        <p class="muted">Demo: admin@tybacha.local, profesional@tybacha.local o cuidador@tybacha.local.</p>
        <form id="loginForm">
          <div class="field"><label for="email">Correo</label><input id="email" type="email" value="admin@tybacha.local" required></div>
          <div class="field"><label for="password">Contrasena</label><input id="password" type="password" value="demo1234" minlength="4" required></div>
          <label class="field"><span>Recordarme</span><input id="remember" type="checkbox" checked></label>
          <button class="button full" type="submit">Entrar</button>
        </form>
        <p class="muted">No tienes cuenta? <a href="register.html">Registrar profesional</a></p>
      </main>
    `;
    document.getElementById("loginForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const email = document.getElementById("email").value.trim().toLowerCase();
      const password = document.getElementById("password").value;
      const user = state.users.find((item) => item.email.toLowerCase() === email && item.status === "Activo");
      if (!user || password.length < 4) {
        toast("Credenciales invalidas o usuario inactivo.");
        return;
      }
      if (user.role === "older_adult") {
        toast("El adulto mayor se registra como ficha, no como usuario con acceso.");
        return;
      }
      user.lastLogin = new Date().toISOString().slice(0, 16).replace("T", " ");
      addAudit(user.name, "Inicio sesion", "sessions", "Token JWT simulado creado");
      saveState();
      setSession(user, document.getElementById("remember").checked);
      window.location.href = "dashboard.html";
    });
  }

  function renderRegister() {
    document.body.className = "auth-page";
    document.body.innerHTML = `
      <section class="auth-panel">
        <div class="brand">
          <div class="brand-mark">TY</div>
          <div><strong>Tybacha</strong><span>Registro profesional</span></div>
        </div>
        <h1>Alta segura para profesionales.</h1>
        <p>El registro crea usuario, perfil asociado y rol profesional. En produccion la contrasena se cifra con bcrypt desde el backend.</p>
        ${copyright()}
      </section>
      <main class="auth-card">
        <h1>Crear cuenta</h1>
        <form id="registerForm">
          <div class="field"><label for="name">Nombre completo</label><input id="name" required></div>
          <div class="field"><label for="email">Correo</label><input id="email" type="email" required></div>
          <div class="field"><label for="phone">Telefono</label><input id="phone" required></div>
          ${photoField("photo", "Foto del profesional")}
          <div class="field"><label for="password">Contrasena</label><input id="password" type="password" minlength="8" required></div>
          <button class="button full" type="submit">Registrar profesional</button>
        </form>
        <p class="muted">Ya tienes cuenta? <a href="login.html">Iniciar sesion</a></p>
      </main>
    `;
    document.getElementById("registerForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = document.getElementById("email").value.trim().toLowerCase();
      if (state.users.some((user) => user.email.toLowerCase() === email)) {
        toast("Ya existe un usuario con ese correo.");
        return;
      }
      const user = {
        id: Date.now(),
        name: document.getElementById("name").value.trim(),
        email,
        role: "professional",
        status: "Activo",
        phone: document.getElementById("phone").value.trim(),
        photoUrl: await readPhotoFile(document.getElementById("photo")),
        lastLogin: "Nuevo"
      };
      state.users.push(user);
      addAudit(user.name, "Registro usuario", "users", "Perfil profesional creado automaticamente");
      saveState();
      setSession(user, true);
      window.location.href = "dashboard.html";
    });
  }

  function renderShell() {
    const user = currentUser();
    const role = roleOf(user);
    document.body.className = "app-shell";
    const navItems = routes
      .filter((route) => can(route.permission))
      .map((route) => `<a class="${route.id === page ? "active" : ""}" href="${route.href}">${route.label}</a>`)
      .join("");
    document.body.innerHTML = `
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">TY</div>
          <div><strong>Tybacha</strong><span>${escapeHtml(role.name)}</span></div>
        </div>
        <nav class="nav">${navItems}</nav>
        ${copyright()}
      </aside>
      <main class="main">
        <header class="topbar">
          <div>
            <h1>${titles[page] || "Tybacha"}</h1>
            <span class="muted">Sesion protegida con token JWT simulado y permisos por rol.</span>
          </div>
          <div class="user-chip">
            ${personPhoto(user.photoUrl, user.name)}
            <div><strong>${escapeHtml(user.name)}</strong><br><span>${escapeHtml(role.name)}</span></div>
            <button class="button secondary" id="logoutButton" type="button">Salir</button>
          </div>
        </header>
        <section class="content" id="content"></section>
      </main>
    `;
    document.getElementById("logoutButton").addEventListener("click", () => {
      addAudit(user.name, "Cerro sesion", "sessions", "Sesion finalizada manualmente");
      saveState();
      localStorage.removeItem(sessionKey);
      sessionStorage.removeItem(sessionKey);
      window.location.href = "login.html";
    });
  }

  function copyright() {
    return `<p class="copyright">© 2026 Tybacha. Derechos de autor: Samuel Segura Vargas y Cristhian Ramírez.</p>`;
  }

  function routePage() {
    const renderers = {
      dashboard: renderDashboard,
      users: renderUsers,
      roles: renderRoles,
      profile: renderProfile,
      adults: renderAdults,
      adultDetail: renderAdultDetail,
      caregivers: renderCaregivers,
      sft: renderSft,
      plans: renderPlans,
      tracking: renderTracking,
      alerts: renderAlerts,
      reports: renderReports,
      consents: renderConsents,
      audit: renderAudit,
      settings: renderSettings
    };
    const route = routes.find((item) => item.id === page);
    if (route && !can(route.permission)) {
      document.getElementById("content").innerHTML = `<div class="empty">No tienes permiso para acceder a este modulo.</div>`;
      return;
    }
    renderers[page]();
  }

  function metric(label, value, note) {
    return `<article class="card metric"><span class="metric-label">${label}</span><span class="metric-value">${value}</span><span class="muted">${note}</span></article>`;
  }

  function renderDashboard() {
    const activeAdults = visibleAdults().filter((adult) => adult.status === "Activo").length;
    const avg = Math.round(visibleAdults().reduce((sum, adult) => sum + adult.adherence, 0) / visibleAdults().length || 0);
    document.getElementById("content").innerHTML = `
      <section class="grid four">
        ${metric("Adultos activos", activeAdults, "Con seguimiento disponible")}
        ${metric("Cumplimiento promedio", avg + "%", "Planes vigentes")}
        ${metric("Alertas abiertas", state.notifications.filter((item) => item.type === "Alerta").length, "Requieren revision")}
        ${metric("Consentimientos vigentes", state.consents.filter((item) => item.status === "Vigente").length, "Datos sensibles habilitados")}
      </section>
      <section class="charts-grid">
        ${barChart("Cumplimiento por adulto mayor", visibleAdults().map((adult) => ({ label: fullName(adult), value: adult.adherence })), "%")}
        ${donutChart("Estados de ejercicios", exerciseStatusCounts())}
        ${lineChart("Evolucion del cumplimiento semanal", trendSeries())}
        ${barChart("Resultados SFT recientes", sftScoreSeries(), " pts", "alt")}
      </section>
      <section class="grid two">
        <article class="card">
          <div class="section-header"><h2>Seguimiento reciente</h2><a class="button secondary" href="tracking.html">Ver bitacora</a></div>
          ${activityTable(state.activityLogs.slice(0, 4))}
        </article>
        <article class="card">
          <div class="section-header"><h2>Alertas y novedades</h2><a class="button secondary" href="alerts.html">Ver alertas</a></div>
          <div class="timeline">${state.notifications.map((item) => `<div class="timeline-item"><strong>${escapeHtml(item.type)}</strong><br><span>${escapeHtml(item.content)}</span><br>${status(item.status)}</div>`).join("")}</div>
        </article>
      </section>
      <section class="card">
        <div class="section-header"><h2>Adultos con mayor prioridad</h2><a class="button" href="adults.html">Gestionar</a></div>
        ${adultsTable(visibleAdults().sort((a, b) => a.adherence - b.adherence))}
      </section>
    `;
  }

  function renderUsers() {
    document.getElementById("content").innerHTML = `
      <section class="section">
        <div class="section-header">
          <div><h2>Usuarios del sistema</h2><span class="muted">Validacion de duplicados, roles y estado de acceso.</span></div>
          <button class="button" id="addUser">Crear usuario</button>
        </div>
        ${usersTable()}
      </section>
    `;
    document.getElementById("addUser").addEventListener("click", () => {
      const email = prompt("Correo del nuevo profesional");
      if (!email) return;
      if (state.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
        toast("Ya existe un usuario con ese correo.");
        return;
      }
      state.users.push({ id: Date.now(), name: "Nuevo profesional", email, role: "professional", status: "Activo", phone: "Pendiente", photoUrl: "", lastLogin: "Nuevo" });
      addAudit(currentUser().name, "Creo usuario", "users", email);
      saveState();
      renderUsers();
      toast("Usuario profesional creado.");
    });
  }

  function usersTable() {
    return table(["Usuario", "Correo", "Rol", "Estado", "Ultimo acceso"], state.users.map((user) => [
      `<div class="person-row compact">${personPhoto(user.photoUrl, user.name)}<strong>${escapeHtml(user.name)}</strong></div>`,
      user.email,
      roleOf(user)?.name || user.role,
      status(user.status),
      user.lastLogin
    ]));
  }

  function renderRoles() {
    document.getElementById("content").innerHTML = `
      ${currentUser().role === "admin" ? roleMonitoring() : ""}
      <section class="grid two">
        ${state.roles.map((role) => `
          <article class="card">
            <h2>${escapeHtml(role.name)}</h2>
            <p class="muted">${escapeHtml(role.description)}</p>
            <div class="toolbar">${role.permissions.map((item) => `<span class="status">${escapeHtml(item)}</span>`).join("")}</div>
          </article>
        `).join("")}
      </section>
    `;
  }

  function roleMonitoring() {
    const monitoredRoles = [
      { id: "professional", label: "Profesionales", description: "Usuarios con gestion clinica, SFT y planes." },
      { id: "caregiver", label: "Cuidadores", description: "Usuarios con seguimiento diario asignado." }
    ];
    return `
      <section class="section">
        <div class="section-header">
          <div><h2>Monitoreo de roles</h2><span class="muted">Vista solo para admin sobre profesionales y cuidadores.</span></div>
        </div>
        <div class="grid two">
          ${monitoredRoles.map((role) => {
            const users = state.users.filter((user) => user.role === role.id);
            const active = users.filter((user) => user.status === "Activo").length;
            return `
              <article class="card">
                <div class="section-header"><h2>${role.label}</h2>${status(active + " activos")}</div>
                <p class="muted">${role.description}</p>
                <div class="toolbar">
                  ${metricInline("Total", users.length)}
                  ${metricInline("Inactivos", users.length - active)}
                </div>
                <div class="role-list">
                  ${users.map((user) => `
                    <div class="person-row">
                      ${personPhoto(user.photoUrl, user.name)}
                      <div><strong>${escapeHtml(user.name)}</strong><br><span class="muted">${escapeHtml(user.email)} | Ultimo acceso: ${escapeHtml(user.lastLogin)}</span></div>
                    </div>
                  `).join("") || "<p class='muted'>Sin registros.</p>"}
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function metricInline(label, value) {
    return `<span class="status"><strong>${escapeHtml(value)}</strong> ${escapeHtml(label)}</span>`;
  }

  function renderProfile() {
    const user = currentUser();
    document.getElementById("content").innerHTML = `
      <section class="grid two">
        <form class="card" id="profileForm">
          <h2>Informacion personal</h2>
          <div class="person-media">
            ${personPhoto(user.photoUrl, user.name, "large")}
            <p class="muted">La foto se muestra en el monitoreo de roles, listados y encabezado de sesion.</p>
          </div>
          <div class="field"><label>Nombre</label><input id="profileName" value="${escapeHtml(user.name)}" required></div>
          <div class="field"><label>Correo</label><input id="profileEmail" type="email" value="${escapeHtml(user.email)}" required></div>
          <div class="field"><label>Telefono</label><input id="profilePhone" value="${escapeHtml(user.phone)}" required></div>
          ${photoField("profilePhoto", "Actualizar foto")}
          <button class="button" type="submit">Guardar perfil</button>
        </form>
        <article class="card">
          <h2>Seguridad</h2>
          <p class="muted">En backend real: bcrypt para contrasenas, JWT firmado, refresh token, expiracion y revocacion de sesiones.</p>
          <p>${status("Activo")} ${status(roleOf(user).name)}</p>
        </article>
      </section>
    `;
    document.getElementById("profileForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      user.name = document.getElementById("profileName").value.trim();
      user.email = document.getElementById("profileEmail").value.trim();
      user.phone = document.getElementById("profilePhone").value.trim();
      const photoUrl = await readPhotoFile(document.getElementById("profilePhoto"));
      if (photoUrl) user.photoUrl = photoUrl;
      if (user.role === "caregiver") {
        const caregiver = state.caregivers.find((item) => item.id === user.id);
        if (caregiver) {
          caregiver.name = user.name;
          caregiver.email = user.email;
          caregiver.phone = user.phone;
          if (photoUrl) caregiver.photoUrl = photoUrl;
        }
      }
      addAudit(user.name, "Actualizo perfil", "profiles", "Datos personales actualizados");
      saveState();
      toast("Perfil actualizado.");
    });
  }

  function visibleAdults() {
    const user = currentUser();
    if (user.role === "caregiver") return state.olderAdults.filter((adult) => adult.caregiverId === user.id);
    return state.olderAdults;
  }

  function renderAdults() {
    document.getElementById("content").innerHTML = `
      <section class="section">
        <div class="section-header">
          <div><h2>Listado paginado</h2><span class="muted">Busqueda, filtros, soft delete y reactivacion.</span></div>
          <button class="button" id="createAdult">Crear adulto mayor</button>
        </div>
        <div class="toolbar">
          <input class="search" id="adultSearch" placeholder="Buscar por nombre, patologia o estado">
          <select id="adultFilter"><option value="">Todos</option><option>Activo</option><option>Inactivo</option></select>
        </div>
        <div id="adultsResult"></div>
      </section>
    `;
    const refresh = () => {
      const q = document.getElementById("adultSearch").value.toLowerCase();
      const f = document.getElementById("adultFilter").value;
      const adults = visibleAdults().filter((adult) => {
        const haystack = [fullName(adult), adult.status, adult.gender, adult.pathologies.join(" ")].join(" ").toLowerCase();
        return haystack.includes(q) && (!f || adult.status === f);
      });
      document.getElementById("adultsResult").innerHTML = adultsTable(adults);
      bindAdultActions();
    };
    document.getElementById("adultSearch").addEventListener("input", refresh);
    document.getElementById("adultFilter").addEventListener("change", refresh);
    document.getElementById("createAdult").addEventListener("click", openAdultModal);
    refresh();
  }

  function adultsTable(adults) {
    return table(["Adulto mayor", "Edad", "Estado", "Consentimiento", "Acceso", "Riesgo", "Cumplimiento", "Acciones"], adults.map((adult) => [
      `<div class="person-row compact">${personPhoto(adult.photoUrl, fullName(adult))}<strong>${escapeHtml(fullName(adult))}</strong></div>`,
      age(adult.birthDate),
      status(adult.status),
      status(adult.consent),
      adult.appAccess || "Sin acceso",
      adult.risk,
      `<div class="progress" aria-label="${adult.adherence}%"><span style="width:${adult.adherence}%"></span></div><span class="muted">${adult.adherence}%</span>`,
      `<a class="button secondary" href="adult-detail.html?id=${adult.id}">Ficha</a> <button class="button secondary adult-toggle" data-id="${adult.id}">${adult.status === "Activo" ? "Desactivar" : "Reactivar"}</button>`
    ]));
  }

  function bindAdultActions() {
    document.querySelectorAll(".adult-toggle").forEach((button) => {
      button.addEventListener("click", () => {
        const adult = adultById(button.dataset.id);
        adult.status = adult.status === "Activo" ? "Inactivo" : "Activo";
        addAudit(currentUser().name, adult.status === "Activo" ? "Reactivo adulto" : "Desactivo adulto", "older_adults", fullName(adult));
        saveState();
        renderAdults();
        toast("Estado actualizado.");
      });
    });
  }

  function openAdultModal() {
    const isCaregiver = currentUser().role === "caregiver";
    const caregivers = state.caregivers.map((caregiver) => `<option value="${caregiver.id}">${escapeHtml(caregiver.name)}</option>`).join("");
    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.innerHTML = `
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="adultModalTitle">
        <div class="modal-header">
          <div>
            <h2 id="adultModalTitle">Registrar adulto mayor</h2>
            <span class="muted">Esto crea una ficha de seguimiento, no una cuenta para iniciar sesion.</span>
          </div>
          <button class="button secondary modal-close" type="button">Cerrar</button>
        </div>
        <form class="modal-body" id="adultForm">
          <div class="form-grid">
            <div class="field"><label for="adultFirstName">Nombre</label><input id="adultFirstName" required></div>
            <div class="field"><label for="adultLastName">Apellidos</label><input id="adultLastName" required></div>
            ${photoField("adultPhoto", "Foto del adulto mayor")}
            <div class="field"><label for="adultBirthDate">Fecha de nacimiento</label><input id="adultBirthDate" type="date" required></div>
            <div class="field">
              <label for="adultGender">Genero</label>
              <select id="adultGender" required>
                <option value="">Seleccionar</option>
                <option>Femenino</option>
                <option>Masculino</option>
                <option>No especificado</option>
              </select>
            </div>
            <div class="field"><label for="adultPhone">Telefono</label><input id="adultPhone" required></div>
            <div class="field"><label for="adultAddress">Direccion</label><input id="adultAddress" required></div>
            <div class="field full"><label for="adultEmergency">Contacto de emergencia</label><input id="adultEmergency" placeholder="Nombre - parentesco - telefono" required></div>
            ${isCaregiver ? `
              <div class="field">
                <label>Cuidador asignado</label>
                <input value="${escapeHtml(currentUser().name)}" disabled>
                <span class="muted">Se asignara automaticamente a tu usuario.</span>
              </div>
            ` : `
              <div class="field">
                <label for="adultCaregiver">Cuidador asignado</label>
                <select id="adultCaregiver">
                  <option value="">Sin asignar</option>
                  ${caregivers}
                </select>
              </div>
            `}
            <div class="field">
              <label for="adultConsent">Consentimiento</label>
              <select id="adultConsent">
                <option>Pendiente</option>
                <option>Vigente</option>
                <option>Vencido</option>
                <option>Revocado</option>
              </select>
            </div>
            <div class="field full"><label for="adultPathologies">Patologias o antecedentes</label><textarea id="adultPathologies" placeholder="Separar por comas"></textarea></div>
            <div class="field full"><label for="adultMedications">Medicamentos</label><textarea id="adultMedications" placeholder="Separar por comas"></textarea></div>
          </div>
          <div class="toolbar">
            <button class="button" type="submit">Guardar adulto mayor</button>
            <button class="button secondary modal-close" type="button">Cancelar</button>
          </div>
        </form>
      </section>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#adultFirstName").focus();
    modal.querySelectorAll(".modal-close").forEach((button) => button.addEventListener("click", () => modal.remove()));
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.remove();
    });
    modal.querySelector("#adultForm").addEventListener("submit", (event) => {
      event.preventDefault();
      createAdultFromForm(modal);
    });
  }

  async function createAdultFromForm(modal) {
    const firstName = modal.querySelector("#adultFirstName").value.trim();
    const lastName = modal.querySelector("#adultLastName").value.trim();
    const caregiverId = currentUser().role === "caregiver" ? currentUser().id : Number(modal.querySelector("#adultCaregiver")?.value) || null;
    const professionalId = ["admin", "professional"].includes(currentUser().role)
      ? currentUser().id
      : state.users.find((user) => user.role === "professional" && user.status === "Activo")?.id || null;
    if (!firstName || !lastName) {
      toast("Nombre y apellidos son obligatorios.");
      return;
    }
    const pathologies = splitCsv(modal.querySelector("#adultPathologies").value);
    const medications = splitCsv(modal.querySelector("#adultMedications").value);
    const id = Date.now();
    state.olderAdults.push({
      id,
      firstName,
      lastName,
      birthDate: modal.querySelector("#adultBirthDate").value,
      gender: modal.querySelector("#adultGender").value,
      status: "Activo",
      consent: modal.querySelector("#adultConsent").value,
      phone: modal.querySelector("#adultPhone").value.trim(),
      photoUrl: await readPhotoFile(modal.querySelector("#adultPhoto")),
      address: modal.querySelector("#adultAddress").value.trim(),
      caregiverId,
      professionalId,
      appAccess: "Sin acceso",
      adherence: 0,
      risk: "Por evaluar",
      pathologies,
      medications,
      emergencyContact: modal.querySelector("#adultEmergency").value.trim(),
      updatedAt: new Date().toISOString().slice(0, 10)
    });
    if (caregiverId) {
      const caregiver = state.caregivers.find((item) => item.id === caregiverId);
      if (caregiver && !caregiver.assignedAdults.includes(id)) caregiver.assignedAdults.push(id);
    }
    addAudit(currentUser().name, "Creo adulto mayor", "older_adults", firstName + " " + lastName);
    saveState();
    modal.remove();
    renderAdults();
    toast("Adulto mayor creado.");
  }

  function splitCsv(value) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  function renderAdultDetail() {
    const params = new URLSearchParams(window.location.search);
    const adults = visibleAdults();
    if (!adults.length) {
      document.getElementById("content").innerHTML = `<div class="empty">No hay fichas disponibles para este usuario.</div>`;
      return;
    }
    document.getElementById("content").innerHTML = `
      <section class="section">
        <div class="section-header">
          <div><h2>Fichas integrales</h2><span class="muted">Selecciona un adulto mayor para ver toda su informacion en detalle.</span></div>
        </div>
        <div class="grid three adult-card-grid">
          ${adults.map(adultSummaryCard).join("")}
        </div>
      </section>
    `;
    document.querySelectorAll(".adult-summary-card").forEach((card) => {
      const open = () => openAdultDetailModal(Number(card.dataset.id));
      card.addEventListener("click", open);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });
    const selected = adultById(params.get("id"));
    if (selected && adults.some((adult) => adult.id === selected.id)) openAdultDetailModal(selected.id);
  }

  function adultSummaryCard(adult) {
    const caregiver = state.caregivers.find((item) => item.id === adult.caregiverId);
    const plan = state.plans.find((item) => item.adultId === adult.id);
    return `
      <article class="card click-card adult-summary-card" data-id="${adult.id}" tabindex="0" role="button" aria-label="Abrir ficha integral de ${escapeHtml(fullName(adult))}">
        <div class="adult-card-photo">${personPhoto(adult.photoUrl, fullName(adult), "large")}</div>
        <div class="section-header"><h2>${escapeHtml(fullName(adult))}</h2>${status(adult.status)}</div>
        <p class="muted">${age(adult.birthDate)} anos | ${escapeHtml(adult.gender)} | Riesgo ${escapeHtml(adult.risk)}</p>
        <div class="progress" aria-label="${adult.adherence}%"><span style="width:${adult.adherence}%"></span></div>
        <div class="adult-card-meta">
          <span><strong>${adult.adherence}%</strong> cumplimiento</span>
          <span>${status(adult.consent)}</span>
        </div>
        <p><strong>Cuidador:</strong> ${escapeHtml(caregiver?.name || "Sin asignar")}</p>
        <p><strong>Plan:</strong> ${escapeHtml(plan?.title || "Sin plan asociado")}</p>
      </article>
    `;
  }

  function openAdultDetailModal(adultId) {
    const adult = adultById(adultId);
    if (!adult) return;
    const caregiver = state.caregivers.find((item) => item.id === adult.caregiverId);
    const professional = state.users.find((item) => item.id === adult.professionalId);
    const sft = state.sftResults.filter((item) => item.adultId === adult.id);
    const plans = state.plans.filter((item) => item.adultId === adult.id);
    const logs = state.activityLogs.filter((item) => item.adultId === adult.id);
    document.querySelectorAll(".adult-detail-modal").forEach((node) => node.remove());
    const modal = document.createElement("div");
    modal.className = "modal-backdrop adult-detail-modal";
    modal.innerHTML = `
      <section class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="adultDetailModalTitle">
        <div class="modal-header adult-detail-hero">
          <div class="person-media">
            ${personPhoto(adult.photoUrl, fullName(adult), "large")}
            <div>
              <h2 id="adultDetailModalTitle">${escapeHtml(fullName(adult))}</h2>
              <span class="muted">Ficha integral dinamica | Actualizado: ${escapeHtml(adult.updatedAt)}</span>
            </div>
          </div>
          <button class="button secondary modal-close" type="button">Cerrar</button>
        </div>
        <div class="modal-body adult-detail-body">
          <section class="grid four">
            ${metric("Edad", age(adult.birthDate), escapeHtml(adult.gender))}
            ${metric("Riesgo", escapeHtml(adult.risk), "Nivel actual")}
            ${metric("Cumplimiento", adult.adherence + "%", "Adherencia general")}
            ${metric("Acceso", escapeHtml(adult.appAccess || "Sin acceso"), "Aplicativo")}
          </section>
          <section class="grid two">
            <article class="card">
              <h2>Datos personales</h2>
              <p><strong>Estado:</strong> ${status(adult.status)} <strong>Consentimiento:</strong> ${status(adult.consent)}</p>
              <p><strong>Nacimiento:</strong> ${escapeHtml(adult.birthDate)}</p>
              <p><strong>Telefono:</strong> ${escapeHtml(adult.phone)}</p>
              <p><strong>Direccion:</strong> ${escapeHtml(adult.address)}</p>
              <p><strong>Emergencia:</strong> ${escapeHtml(adult.emergencyContact)}</p>
            </article>
            <article class="card">
              <h2>Equipo asignado</h2>
              <p><strong>Profesional:</strong> ${escapeHtml(professional?.name || "Sin asignar")}</p>
              <p><strong>Cuidador:</strong> ${escapeHtml(caregiver?.name || "Sin asignar")}</p>
              <p><strong>Contacto cuidador:</strong> ${escapeHtml(caregiver?.phone || "No registrado")}</p>
              <p><strong>Turno:</strong> ${escapeHtml(caregiver?.shift || "No asignado")}</p>
            </article>
          </section>
          <section class="grid two">
            <article class="card">
              <div class="section-header"><h2>Historial medico</h2><button class="button secondary" id="updateMedical" type="button">Actualizar</button></div>
              <p><strong>Patologias:</strong> ${adult.pathologies.map(escapeHtml).join(", ") || "Sin registros"}</p>
              <p><strong>Medicamentos:</strong> ${adult.medications.map(escapeHtml).join(", ") || "Sin registros"}</p>
            </article>
            <article class="card">
              <h2>Seguimiento reciente</h2>
              ${activityTable(logs.slice(0, 4))}
            </article>
          </section>
          <section class="grid two">
            <article class="card"><h2>Historial SFT</h2>${sftTable(sft)}</article>
            <article class="card"><h2>Planes asociados</h2>${plans.map(planCard).join("") || "<p class='muted'>Sin planes.</p>"}</article>
          </section>
        </div>
      </section>
    `;
    document.body.appendChild(modal);
    modal.querySelector(".modal-close").focus();
    const closeModal = () => {
      document.removeEventListener("keydown", handleEscape);
      modal.remove();
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleEscape);
    modal.querySelectorAll(".modal-close").forEach((button) => button.addEventListener("click", closeModal));
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    modal.querySelector("#updateMedical").addEventListener("click", () => {
      const pathology = prompt("Agregar patologia o condicion");
      if (!pathology) return;
      adult.pathologies.push(pathology);
      adult.updatedAt = new Date().toISOString().slice(0, 10);
      addAudit(currentUser().name, "Actualizo historial medico", "medical_histories", fullName(adult) + ": " + pathology);
      saveState();
      closeModal();
      renderAdultDetail();
      openAdultDetailModal(adult.id);
      toast("Historial medico actualizado.");
    });
  }

  function renderCaregivers() {
    const canRegisterCaregiver = ["admin", "professional"].includes(currentUser().role);
    const canOpenTechnicalFile = currentUser().role === "admin";
    document.getElementById("content").innerHTML = `
      <section class="section">
        <div class="section-header">
          <div><h2>Cuidadores registrados</h2><span class="muted">${canOpenTechnicalFile ? "Selecciona una tarjeta para abrir la ficha tecnica del cuidador." : "Administradores y profesionales pueden registrar cuidadores."}</span></div>
          ${canRegisterCaregiver ? `<button class="button" id="createCaregiver">Registrar cuidador</button>` : ""}
        </div>
      </section>
      <section class="grid two">
        ${state.caregivers.map((caregiver) => `
          <article class="card caregiver-card ${canOpenTechnicalFile ? "click-card" : ""}" data-id="${caregiver.id}" ${canOpenTechnicalFile ? `tabindex="0" role="button" aria-label="Abrir ficha tecnica de ${escapeHtml(caregiver.name)}"` : ""}>
            <div class="person-media">
              ${personPhoto(caregiver.photoUrl, caregiver.name, "large")}
              <div>
                <div class="section-header"><h2>${escapeHtml(caregiver.name)}</h2>${status(caregiver.status)}</div>
                <p class="muted">${escapeHtml(caregiver.email)} | ${escapeHtml(caregiver.phone)}</p>
              </div>
            </div>
            <p><strong>Turno:</strong> ${escapeHtml(caregiver.shift)} | <strong>Permisos:</strong> ${escapeHtml(caregiver.permissions)}</p>
            <p><strong>Adultos asignados:</strong> ${caregiver.assignedAdults.map((id) => fullName(adultById(id))).join(", ") || "Ninguno"}</p>
            ${canOpenTechnicalFile ? `<span class="status">Ver ficha tecnica</span>` : ""}
            <button class="button secondary transfer-caregiver" data-id="${caregiver.id}">Modificar asignaciones</button>
          </article>
        `).join("")}
      </section>
    `;
    if (canRegisterCaregiver) {
      document.getElementById("createCaregiver").addEventListener("click", openCaregiverModal);
    }
    if (canOpenTechnicalFile) {
      document.querySelectorAll(".caregiver-card").forEach((card) => {
        const open = () => openCaregiverTechnicalModal(Number(card.dataset.id));
        card.addEventListener("click", open);
        card.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open();
          }
        });
      });
    }
    document.querySelectorAll(".transfer-caregiver").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        toast("Flujo de transferencia listo para conectar a backend.");
      });
    });
  }

  function openCaregiverTechnicalModal(caregiverId) {
    const caregiver = state.caregivers.find((item) => item.id === caregiverId);
    if (!caregiver) return;
    const user = state.users.find((item) => item.id === caregiver.id);
    const assignedAdults = caregiver.assignedAdults.map(adultById).filter(Boolean);
    const completedLogs = state.activityLogs.filter((log) => caregiver.assignedAdults.includes(log.adultId) && log.status === "Completado").length;
    const omittedLogs = state.activityLogs.filter((log) => caregiver.assignedAdults.includes(log.adultId) && log.status === "Omitido").length;
    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.innerHTML = `
      <section class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="caregiverTechnicalTitle">
        <div class="modal-header caregiver-detail-hero">
          <div class="person-media">
            ${personPhoto(caregiver.photoUrl, caregiver.name, "large")}
            <div>
              <h2 id="caregiverTechnicalTitle">${escapeHtml(caregiver.name)}</h2>
              <span class="muted">Ficha tecnica del cuidador | ${escapeHtml(caregiver.email)}</span>
            </div>
          </div>
          <button class="button secondary modal-close" type="button">Cerrar</button>
        </div>
        <div class="modal-body caregiver-detail-body">
          <section class="grid four">
            ${metric("Estado", escapeHtml(caregiver.status), "Acceso del usuario")}
            ${metric("Turno", escapeHtml(caregiver.shift), "Horario operativo")}
            ${metric("Asignados", assignedAdults.length, "Adultos mayores")}
            ${metric("Completadas", completedLogs, "Actividades registradas")}
          </section>
          <section class="grid two">
            <article class="card">
              <h2>Datos de contacto</h2>
              <p><strong>Telefono:</strong> ${escapeHtml(caregiver.phone)}</p>
              <p><strong>Correo:</strong> ${escapeHtml(caregiver.email)}</p>
              <p><strong>Direccion:</strong> ${escapeHtml(caregiver.address || "No registrada")}</p>
              <p><strong>Emergencia:</strong> ${escapeHtml(caregiver.emergencyContact || "No registrada")}</p>
            </article>
            <article class="card">
              <h2>Perfil operativo</h2>
              <p><strong>Documento:</strong> ${escapeHtml(caregiver.documentNumber || "No registrado")}</p>
              <p><strong>Permisos:</strong> ${escapeHtml(caregiver.permissions)}</p>
              <p><strong>Ultimo acceso:</strong> ${escapeHtml(user?.lastLogin || "Nuevo")}</p>
              <p><strong>Omitidas:</strong> ${omittedLogs}</p>
            </article>
          </section>
          <section class="grid two">
            <article class="card">
              <h2>Notas</h2>
              <p>${escapeHtml(caregiver.notes || "Sin notas registradas.")}</p>
            </article>
            <article class="card">
              <h2>Adultos asignados</h2>
              <div class="caregiver-assigned-list">
                ${assignedAdults.map((adult) => `
                  <div class="person-row caregiver-assigned-item">
                    ${personPhoto(adult.photoUrl, fullName(adult))}
                    <div><strong>${escapeHtml(fullName(adult))}</strong><br><span class="muted">${escapeHtml(adult.risk)} | ${escapeHtml(adult.adherence)}% cumplimiento</span></div>
                  </div>
                `).join("") || "<p class='muted'>No tiene adultos asignados.</p>"}
              </div>
            </article>
          </section>
        </div>
      </section>
    `;
    document.body.appendChild(modal);
    modal.querySelector(".modal-close").focus();
    modal.querySelectorAll(".modal-close").forEach((button) => button.addEventListener("click", () => modal.remove()));
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.remove();
    });
  }

  function openCaregiverModal() {
    const adults = state.olderAdults
      .filter((adult) => adult.status === "Activo")
      .map((adult) => `
        <label class="field">
          <span>${escapeHtml(fullName(adult))}</span>
          <input type="checkbox" name="assignedAdults" value="${adult.id}">
        </label>
      `)
      .join("");
    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.innerHTML = `
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="caregiverModalTitle">
        <div class="modal-header">
          <div>
            <h2 id="caregiverModalTitle">Registrar cuidador</h2>
            <span class="muted">Crea la cuenta de acceso del cuidador y su perfil de asignacion.</span>
          </div>
          <button class="button secondary modal-close" type="button">Cerrar</button>
        </div>
        <form class="modal-body" id="caregiverForm">
          <div class="form-grid">
            <div class="field"><label for="caregiverName">Nombre completo</label><input id="caregiverName" required></div>
            <div class="field"><label for="caregiverEmail">Correo de acceso</label><input id="caregiverEmail" type="email" required></div>
            <div class="field"><label for="caregiverPhone">Telefono</label><input id="caregiverPhone" required></div>
            ${photoField("caregiverPhoto", "Foto del cuidador")}
            <div class="field"><label for="caregiverDocument">Documento</label><input id="caregiverDocument" required></div>
            <div class="field">
              <label for="caregiverShift">Turno</label>
              <select id="caregiverShift" required>
                <option value="">Seleccionar</option>
                <option>Manana</option>
                <option>Tarde</option>
                <option>Noche</option>
                <option>Rotativo</option>
              </select>
            </div>
            <div class="field">
              <label for="caregiverStatus">Estado</label>
              <select id="caregiverStatus">
                <option>Activo</option>
                <option>Inactivo</option>
              </select>
            </div>
            <div class="field full"><label for="caregiverAddress">Direccion</label><input id="caregiverAddress"></div>
            <div class="field full"><label for="caregiverEmergency">Contacto de emergencia</label><input id="caregiverEmergency" placeholder="Nombre - parentesco - telefono"></div>
            <div class="field full">
              <label for="caregiverPermissions">Permisos operativos</label>
              <select id="caregiverPermissions">
                <option>Seguimiento y alertas</option>
                <option>Consulta limitada</option>
                <option>Seguimiento, alertas y registro diario</option>
              </select>
            </div>
            <div class="field full">
              <label>Adultos mayores asignados</label>
              <div class="grid two">${adults || "<p class='muted'>No hay adultos activos disponibles.</p>"}</div>
            </div>
            <div class="field full"><label for="caregiverNotes">Notas</label><textarea id="caregiverNotes" placeholder="Disponibilidad, restricciones o indicaciones"></textarea></div>
          </div>
          <div class="toolbar">
            <button class="button" type="submit">Guardar cuidador</button>
            <button class="button secondary modal-close" type="button">Cancelar</button>
          </div>
        </form>
      </section>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#caregiverName").focus();
    modal.querySelectorAll(".modal-close").forEach((button) => button.addEventListener("click", () => modal.remove()));
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.remove();
    });
    modal.querySelector("#caregiverForm").addEventListener("submit", (event) => {
      event.preventDefault();
      createCaregiverFromForm(modal);
    });
  }

  async function createCaregiverFromForm(modal) {
    const name = modal.querySelector("#caregiverName").value.trim();
    const email = modal.querySelector("#caregiverEmail").value.trim().toLowerCase();
    const phone = modal.querySelector("#caregiverPhone").value.trim();
    const documentNumber = modal.querySelector("#caregiverDocument").value.trim();
    const shift = modal.querySelector("#caregiverShift").value;
    const selectedAdults = Array.from(modal.querySelectorAll('input[name="assignedAdults"]:checked')).map((input) => Number(input.value));
    if (!name || !email || !phone || !documentNumber || !shift) {
      toast("Completa los datos obligatorios del cuidador.");
      return;
    }
    if (state.users.some((user) => user.email.toLowerCase() === email)) {
      toast("Ya existe un usuario con ese correo.");
      return;
    }
    const id = Date.now();
    const photoUrl = await readPhotoFile(modal.querySelector("#caregiverPhoto"));
    state.users.push({
      id,
      name,
      email,
      role: "caregiver",
      status: modal.querySelector("#caregiverStatus").value,
      phone,
      photoUrl,
      lastLogin: "Nuevo"
    });
    state.caregivers.push({
      id,
      name,
      email,
      phone,
      photoUrl,
      documentNumber,
      address: modal.querySelector("#caregiverAddress").value.trim(),
      emergencyContact: modal.querySelector("#caregiverEmergency").value.trim(),
      status: modal.querySelector("#caregiverStatus").value,
      assignedAdults: selectedAdults,
      shift,
      permissions: modal.querySelector("#caregiverPermissions").value,
      notes: modal.querySelector("#caregiverNotes").value.trim()
    });
    selectedAdults.forEach((adultId) => {
      const adult = adultById(adultId);
      if (adult) adult.caregiverId = id;
    });
    addAudit(currentUser().name, "Registro cuidador", "caregivers", name);
    saveState();
    modal.remove();
    renderCaregivers();
    toast("Cuidador registrado correctamente.");
  }

  function renderSft() {
    document.getElementById("content").innerHTML = `
      <section class="section">
        <div class="section-header">
          <div><h2>Baterias y resultados SFT</h2><span class="muted">Orden cronologico y relacion con planes.</span></div>
          <button class="button" id="addSft">Registrar prueba SFT</button>
        </div>
        ${sftTable(state.sftResults.sort((a, b) => b.date.localeCompare(a.date)))}
      </section>
    `;
    document.getElementById("addSft").addEventListener("click", () => {
      const adult = visibleAdults()[0];
      state.sftResults.unshift({
        id: Date.now(),
        adultId: adult.id,
        battery: "Senior Fitness Test base",
        date: new Date().toISOString().slice(0, 10),
        responsible: currentUser().name,
        chairStand: 10,
        armCurl: 12,
        twoMinuteStep: 60,
        chairSitReach: 0,
        backScratch: -5,
        eightFootUpGo: 8,
        notes: "Registro de prueba creado desde mock."
      });
      addAudit(currentUser().name, "Registro SFT", "sft_results", fullName(adult));
      saveState();
      renderSft();
      toast("Prueba SFT registrada.");
    });
  }

  function sftTable(items) {
    return table(["Fecha", "Adulto mayor", "Bateria", "Responsable", "Silla-pie", "Brazo", "2 min", "Up&Go", "Notas"], items.map((item) => [
      item.date,
      fullName(adultById(item.adultId)),
      item.battery,
      item.responsible,
      item.chairStand,
      item.armCurl,
      item.twoMinuteStep,
      item.eightFootUpGo + " s",
      item.notes
    ]));
  }

  function renderPlans() {
    const user = currentUser();
    if (user.role === "caregiver") {
      renderCaregiverDailyPlans();
      return;
    }
    const canManagePlans = ["admin", "professional"].includes(user.role);
    const plans = visiblePlans();
    document.getElementById("content").innerHTML = `
      <section class="section">
        <div class="section-header">
          <div><h2>Planes personalizados</h2><span class="muted">${canManagePlans ? "El profesional asigna el plan semanal y se notifica al cuidador y al adulto mayor." : "Registra si la actividad se hizo, porcentaje cumplido y observaciones."}</span></div>
          ${canManagePlans ? `
            <div class="toolbar">
              <button class="button" id="generatePlan">Generar y asignar con IA</button>
              <button class="button secondary" id="manualPlan">Crear plan semanal</button>
            </div>
          ` : ""}
        </div>
        <div class="grid plans-grid">${plans.map(planCard).join("") || `<div class="empty">No hay planes disponibles para tu rol.</div>`}</div>
      </section>
    `;
    if (canManagePlans) {
      document.getElementById("generatePlan").addEventListener("click", openGeneratedPlanModal);
      document.getElementById("manualPlan").addEventListener("click", openManualPlanModal);
    }
    bindPlanActions();
  }

  function renderCaregiverDailyPlans(selectedAdultId) {
    const adults = visibleAdults().filter((adult) => adult.status === "Activo");
    const selectedAdult = adultById(selectedAdultId) || adults[0];
    const day = currentPlanDay();
    document.getElementById("content").innerHTML = `
      <section class="caregiver-plan-shell">
        <div class="daily-hero">
          <div>
            <span class="daily-kicker">Plan de hoy</span>
            <h2>${escapeHtml(day.display)}</h2>
            <p>Elige un adulto mayor y registra como le fue con el ejercicio del dia.</p>
          </div>
          <div class="daily-streak">
            <strong>${completedTodayCount(day.dateKey)}</strong>
            <span>hechos hoy</span>
          </div>
        </div>
        <div class="daily-layout">
          <section class="daily-adults">
            <div class="section-header">
              <div><h2>Adultos asignados</h2><span class="muted">Toca una tarjeta para ver el reto diario.</span></div>
            </div>
            <div class="daily-adult-grid">
              ${adults.map((adult) => caregiverDailyAdultCard(adult, day.planDay, selectedAdult?.id)).join("") || `<div class="empty">No tienes adultos activos asignados.</div>`}
            </div>
          </section>
          <section id="dailyExercisePanel" class="daily-panel">
            ${selectedAdult ? dailyExercisePanel(selectedAdult, day) : ""}
          </section>
        </div>
      </section>
    `;
    bindCaregiverDailyPlanActions(day);
  }

  function currentPlanDay() {
    const now = new Date();
    const days = [
      { planDay: "Domingo", display: "Domingo" },
      { planDay: "Lunes", display: "Lunes" },
      { planDay: "Martes", display: "Martes" },
      { planDay: "Miercoles", display: "Miercoles" },
      { planDay: "Jueves", display: "Jueves" },
      { planDay: "Viernes", display: "Viernes" },
      { planDay: "Sabado", display: "Sabado" }
    ];
    return {
      ...days[now.getDay()],
      dateKey: now.toISOString().slice(0, 10)
    };
  }

  function currentPlanForAdult(adultId) {
    return state.plans
      .filter((plan) => plan.adultId === adultId && plan.status === "Asignado")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || state.plans
      .filter((plan) => plan.adultId === adultId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }

  function exerciseForDay(plan, dayName) {
    if (!plan) return null;
    return plan.exercises.find((exercise) => exercise.day === dayName) || null;
  }

  function completedTodayCount(dateKey) {
    const allowedAdultIds = visibleAdults().map((adult) => adult.id);
    return state.activityLogs.filter((log) => allowedAdultIds.includes(log.adultId) && log.date === dateKey && log.status === "Completado").length;
  }

  function caregiverDailyAdultCard(adult, dayName, selectedAdultId) {
    const plan = currentPlanForAdult(adult.id);
    const exercise = exerciseForDay(plan, dayName);
    const isSelected = adult.id === selectedAdultId;
    return `
      <article class="daily-adult-card ${isSelected ? "selected" : ""}" data-id="${adult.id}" tabindex="0" role="button" aria-label="Seleccionar plan de ${escapeHtml(fullName(adult))}">
        ${personPhoto(adult.photoUrl, fullName(adult), "large")}
        <div>
          <h3>${escapeHtml(fullName(adult))}</h3>
          <p>${exercise ? escapeHtml(exercise.name) : "Sin ejercicio para hoy"}</p>
          ${status(exercise?.status || "Pendiente")}
        </div>
      </article>
    `;
  }

  function dailyExercisePanel(adult, day) {
    const plan = currentPlanForAdult(adult.id);
    const exercise = exerciseForDay(plan, day.planDay);
    if (!plan) {
      return `
        <article class="daily-task-card">
          <div class="person-media">${personPhoto(adult.photoUrl, fullName(adult), "large")}<div><h2>${escapeHtml(fullName(adult))}</h2><p class="muted">Aun no tiene plan semanal asignado.</p></div></div>
          <div class="empty">Cuando el profesional asigne un plan, aqui aparecera el ejercicio del dia.</div>
        </article>
      `;
    }
    if (!exercise) {
      return `
        <article class="daily-task-card">
          <div class="person-media">${personPhoto(adult.photoUrl, fullName(adult), "large")}<div><h2>${escapeHtml(fullName(adult))}</h2><p class="muted">${escapeHtml(plan.title)}</p></div></div>
          <div class="daily-rest">
            <strong>Dia sin ejercicio programado</strong>
            <span>Hoy no hay actividad en el plan. Puedes revisar hidratacion, descanso y bienestar general.</span>
          </div>
        </article>
      `;
    }
    return `
      <article class="daily-task-card">
        <div class="daily-task-head">
          <div class="person-media">
            ${personPhoto(adult.photoUrl, fullName(adult), "large")}
            <div>
              <h2>${escapeHtml(fullName(adult))}</h2>
              <p class="muted">${escapeHtml(plan.title)} | ${escapeHtml(day.planDay)}</p>
            </div>
          </div>
          ${status(exercise.status)}
        </div>
        <div class="daily-exercise">
          <span class="daily-kicker">Ejercicio de hoy</span>
          <h3>${escapeHtml(exercise.name)}</h3>
          <p>${escapeHtml(exercise.duration)} | Intensidad ${escapeHtml(exercise.intensity)}</p>
          <p><strong>Requiere:</strong> ${escapeHtml(exercise.requirement || "Indicaciones del profesional")}</p>
        </div>
        <div class="rating-row" data-plan="${plan.id}" data-day="${escapeHtml(exercise.day)}">
          <button class="rating-button great" data-rating="100" data-status="Completado" type="button"><strong>Excelente</strong><span>Lo hizo completo</span></button>
          <button class="rating-button ok" data-rating="70" data-status="Completado" type="button"><strong>Con ayuda</strong><span>Necesito apoyo</span></button>
          <button class="rating-button incomplete" data-rating="40" data-status="Incompleto" type="button"><strong>Incompleto</strong><span>Lo intento parcialmente</span></button>
          <button class="rating-button hard" data-rating="0" data-status="Omitido" type="button"><strong>No pudo</strong><span>Se omite hoy</span></button>
        </div>
        <label class="daily-notes">Observaciones
          <textarea id="dailyNotes" placeholder="Dolor, fatiga, animo, apoyo requerido...">${escapeHtml(exercise.observations || "")}</textarea>
        </label>
      </article>
    `;
  }

  function bindCaregiverDailyPlanActions(day) {
    document.querySelectorAll(".daily-adult-card").forEach((card) => {
      const select = () => renderCaregiverDailyPlans(Number(card.dataset.id));
      card.addEventListener("click", select);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      });
    });
    document.querySelectorAll(".rating-button").forEach((button) => {
      button.addEventListener("click", () => {
        const row = button.closest(".rating-row");
        saveDailyExerciseRating(row.dataset.plan, row.dataset.day, button.dataset.status, Number(button.dataset.rating), day.dateKey);
      });
    });
  }

  function saveDailyExerciseRating(planId, day, statusValue, compliance, dateKey) {
    const plan = state.plans.find((item) => item.id === Number(planId));
    const exercise = plan?.exercises.find((item) => item.day === day);
    if (!plan || !exercise) return;
    exercise.status = statusValue;
    exercise.compliance = compliance;
    exercise.observations = document.getElementById("dailyNotes")?.value.trim() || "";
    plan.adherence = Math.round(plan.exercises.reduce((sum, item) => sum + Number(item.compliance || 0), 0) / plan.exercises.length);
    state.activityLogs.unshift({
      id: Date.now(),
      adultId: plan.adultId,
      date: dateKey,
      planId: plan.id,
      exercise: exercise.name,
      status: exercise.status,
      minutes: exercise.status === "Completado" ? parseInt(exercise.duration, 10) || 0 : 0,
      notes: exercise.observations || `Calificacion diaria ${exercise.compliance}%`
    });
    addAudit(currentUser().name, "Califico ejercicio diario", "exercise_tracking", `${fullName(adultById(plan.adultId))}: ${exercise.day} ${exercise.compliance}%`);
    saveState();
    renderCaregiverDailyPlans(plan.adultId);
    toast("Calificacion del ejercicio guardada.");
  }

  function visiblePlans() {
    const allowedAdultIds = visibleAdults().map((adult) => adult.id);
    return state.plans.filter((plan) => allowedAdultIds.includes(plan.adultId));
  }

  function openGeneratedPlanModal() {
    const adults = visibleAdults().filter((adult) => adult.status === "Activo");
    if (!adults.length) {
      toast("Primero registra un adulto mayor activo.");
      return;
    }
    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.innerHTML = `
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="generatedPlanTitle">
        <div class="modal-header">
          <div>
            <h2 id="generatedPlanTitle">Asignar plan semanal con IA</h2>
            <span class="muted">Selecciona el adulto mayor. Al guardar se notificara al cuidador y al adulto mayor.</span>
          </div>
          <button class="button secondary modal-close" type="button">Cerrar</button>
        </div>
        <form class="modal-body" id="generatedPlanForm">
          <div class="field"><label for="generatedPlanAdult">Adulto mayor</label><select id="generatedPlanAdult">${adults.map((adult) => `<option value="${adult.id}">${escapeHtml(fullName(adult))}</option>`).join("")}</select></div>
          <div class="toolbar">
            <button class="button" type="submit">Asignar plan semanal</button>
            <button class="button secondary modal-close" type="button">Cancelar</button>
          </div>
        </form>
      </section>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#generatedPlanAdult").focus();
    modal.querySelectorAll(".modal-close").forEach((button) => button.addEventListener("click", () => modal.remove()));
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.remove();
    });
    modal.querySelector("#generatedPlanForm").addEventListener("submit", (event) => {
      event.preventDefault();
      createPlan("Gemini AI", modal.querySelector("#generatedPlanAdult").value);
      modal.remove();
    });
  }

  function createPlan(source, adultId) {
    const adult = adultById(adultId) || visibleAdults()[0];
    if (!adult) {
      toast("Primero registra un adulto mayor.");
      return;
    }
    const plan = {
      id: Date.now(),
      adultId: adult.id,
      title: source === "Gemini AI" ? "Plan generado con Gemini" : "Plan manual",
      source,
      status: "Asignado",
      adherence: 0,
      reviewedBy: currentUser().name,
      createdAt: new Date().toISOString().slice(0, 10),
      exercises: ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"].map((day, index) => ({
        day,
        name: ["Movilidad articular", "Caminata segura", "Fuerza de piernas", "Equilibrio asistido", "Respiracion y estiramiento"][index],
        duration: index === 1 ? "20 min" : "12 min",
        intensity: "Baja",
        requirement: ["Silla estable y supervision", "Ruta segura sin obstaculos", "Banda elastica suave", "Pared o baranda de apoyo", "Espacio tranquilo"][index],
        compliance: 0,
        observations: "",
        status: "Pendiente"
      }))
    };
    state.plans.unshift(plan);
    notifyPlanAssignment(plan, adult);
    addAudit(currentUser().name, "Asigno plan semanal", "exercise_plans", source + " para " + fullName(adult));
    saveState();
    renderPlans();
    toast("Plan semanal asignado y notificaciones enviadas.");
  }

  function openManualPlanModal() {
    const adults = visibleAdults().filter((adult) => adult.status === "Activo");
    if (!adults.length) {
      toast("Primero registra un adulto mayor activo.");
      return;
    }
    const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.innerHTML = `
      <section class="modal modal-wide plan-builder-modal" role="dialog" aria-modal="true" aria-labelledby="manualPlanTitle">
        <div class="modal-header plan-builder-hero">
          <div>
            <span class="daily-kicker">Nuevo plan</span>
            <h2 id="manualPlanTitle">Asignar plan semanal</h2>
            <span class="muted">Construye una semana clara, segura y facil de seguir para el cuidador.</span>
          </div>
          <button class="button secondary modal-close" type="button">Cerrar</button>
        </div>
        <form class="modal-body plan-builder-body" id="manualPlanForm">
          <section class="plan-builder-top">
            <div class="plan-builder-main-fields">
              <div class="field"><label for="manualPlanAdult">Adulto mayor</label><select id="manualPlanAdult">${adults.map((adult) => `<option value="${adult.id}">${escapeHtml(fullName(adult))}</option>`).join("")}</select></div>
              <div class="field"><label for="manualPlanTitleInput">Titulo del plan</label><input id="manualPlanTitleInput" value="Plan semanal personalizado" required></div>
            </div>
            <aside class="plan-builder-summary">
              <strong>5 dias de actividad</strong>
              <span>Se asigna inmediatamente y envia notificacion al cuidador y al adulto mayor.</span>
            </aside>
          </section>
          <section class="plan-day-grid">
            ${days.map((day, index) => `
              <article class="plan-day-editor">
                <div class="plan-day-header">
                  <span>${index + 1}</span>
                  <div><h3>${day}</h3><p>Actividad principal del dia</p></div>
                </div>
                <div class="plan-day-fields">
                  <div class="field"><label for="manualName${index}">Actividad</label><input id="manualName${index}" required placeholder="Ej. Caminata asistida"></div>
                  <div class="field"><label for="manualDuration${index}">Duracion</label><input id="manualDuration${index}" required placeholder="Ej. 15 min"></div>
                  <div class="field intensity-field">
                    <label for="manualIntensity${index}">Intensidad</label>
                    <select id="manualIntensity${index}">
                      <option>Baja</option>
                      <option>Media</option>
                      <option>Alta</option>
                    </select>
                  </div>
                  <div class="field requirement-field"><label for="manualRequirement${index}">Indicaciones y seguridad</label><textarea id="manualRequirement${index}" required placeholder="Materiales, apoyo, restricciones, indicaciones de seguridad"></textarea></div>
                </div>
              </article>
            `).join("")}
          </section>
          <div class="toolbar plan-builder-actions">
            <button class="button" type="submit">Asignar plan semanal</button>
            <button class="button secondary modal-close" type="button">Cancelar</button>
          </div>
        </form>
      </section>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#manualPlanTitleInput").focus();
    modal.querySelectorAll(".modal-close").forEach((button) => button.addEventListener("click", () => modal.remove()));
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.remove();
    });
    modal.querySelector("#manualPlanForm").addEventListener("submit", (event) => {
      event.preventDefault();
      createManualPlanFromForm(modal);
    });
  }

  function createManualPlanFromForm(modal) {
    const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
    const adult = adultById(modal.querySelector("#manualPlanAdult").value);
    const plan = {
      id: Date.now(),
      adultId: adult.id,
      title: modal.querySelector("#manualPlanTitleInput").value.trim(),
      source: "Manual",
      status: "Asignado",
      adherence: 0,
      reviewedBy: currentUser().name,
      createdAt: new Date().toISOString().slice(0, 10),
      exercises: days.map((day, index) => ({
        day,
        name: modal.querySelector(`#manualName${index}`).value.trim(),
        duration: modal.querySelector(`#manualDuration${index}`).value.trim(),
        intensity: modal.querySelector(`#manualIntensity${index}`).value,
        requirement: modal.querySelector(`#manualRequirement${index}`).value.trim(),
        status: "Pendiente",
        compliance: 0,
        observations: ""
      }))
    };
    state.plans.unshift(plan);
    notifyPlanAssignment(plan, adult);
    addAudit(currentUser().name, "Asigno plan semanal manual", "exercise_plans", fullName(adult));
    saveState();
    modal.remove();
    renderPlans();
    toast("Plan semanal asignado y notificaciones enviadas.");
  }

  function notifyPlanAssignment(plan, adult) {
    const caregiver = state.caregivers.find((item) => item.id === adult.caregiverId);
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    const content = `Plan semanal "${plan.title}" asignado por ${currentUser().name} para ${fullName(adult)}.`;
    const recipients = [
      caregiver ? caregiver.name : "",
      fullName(adult)
    ].filter(Boolean);
    recipients.forEach((to, index) => {
      state.notifications.unshift({
        id: Date.now() + index,
        to,
        type: "Plan semanal",
        status: "Enviada",
        date: now,
        content
      });
    });
    addAudit(currentUser().name, "Envio notificacion de plan", "notifications", recipients.join(", ") || fullName(adult));
  }

  function planCard(plan) {
    const adult = adultById(plan.adultId);
    const canManagePlans = ["admin", "professional"].includes(currentUser().role);
    const isCaregiver = currentUser().role === "caregiver";
    return `
      <article class="card">
        <div class="section-header"><h2>${escapeHtml(plan.title)}</h2>${status(plan.status)}</div>
        <p class="muted">${escapeHtml(fullName(adult))} | ${escapeHtml(plan.source)} | ${escapeHtml(plan.createdAt)}</p>
        <div class="weekly-plan">
          ${plan.exercises.map((exercise) => `
            <div class="day-card">
              <strong>${escapeHtml(exercise.day)}</strong>
              <span>${escapeHtml(exercise.name)}</span>
              <span class="muted">${escapeHtml(exercise.duration)} | ${escapeHtml(exercise.intensity)}</span>
              <span><strong>Requiere:</strong> ${escapeHtml(exercise.requirement || "Indicaciones del profesional")}</span>
              ${status(exercise.status)}
              ${isCaregiver ? caregiverPlanControls(plan, exercise) : `<span class="muted">Cumplimiento: ${Number(exercise.compliance || 0)}%</span>${exercise.observations ? `<span class="muted">Obs: ${escapeHtml(exercise.observations)}</span>` : ""}`}
            </div>
          `).join("")}
        </div>
        <p><strong>Cumplimiento:</strong> ${plan.adherence}%</p>
        ${canManagePlans ? `
          <div class="toolbar">
            <button class="button secondary review-plan" data-id="${plan.id}">Marcar revisado</button>
            <button class="button assign-plan" data-id="${plan.id}">${plan.status === "Asignado" ? "Reenviar notificacion" : "Asignar plan semanal"}</button>
          </div>
        ` : ""}
      </article>
    `;
  }

  function caregiverPlanControls(plan, exercise) {
    const key = `${plan.id}-${exercise.day}`;
    return `
      <div class="caregiver-controls">
        <label>Estado
          <select class="exercise-status" data-plan="${plan.id}" data-day="${escapeHtml(exercise.day)}">
            ${["Pendiente", "Completado", "Omitido"].map((option) => `<option ${exercise.status === option ? "selected" : ""}>${option}</option>`).join("")}
          </select>
        </label>
        <label>% cumplido
          <input class="exercise-compliance" data-plan="${plan.id}" data-day="${escapeHtml(exercise.day)}" type="number" min="0" max="100" value="${Number(exercise.compliance || 0)}">
        </label>
        <label>Observaciones
          <textarea class="exercise-observations" data-plan="${plan.id}" data-day="${escapeHtml(exercise.day)}" placeholder="Dolor, fatiga, apoyo requerido, novedades">${escapeHtml(exercise.observations || "")}</textarea>
        </label>
        <button class="button secondary save-exercise-tracking" data-plan="${plan.id}" data-day="${escapeHtml(exercise.day)}" type="button">Guardar seguimiento</button>
      </div>
    `;
  }

  function bindPlanActions() {
    document.querySelectorAll(".review-plan").forEach((button) => button.addEventListener("click", () => updatePlanStatus(button.dataset.id, "Revisado")));
    document.querySelectorAll(".assign-plan").forEach((button) => button.addEventListener("click", () => updatePlanStatus(button.dataset.id, "Asignado")));
    document.querySelectorAll(".save-exercise-tracking").forEach((button) => {
      button.addEventListener("click", () => saveExerciseTracking(button.dataset.plan, button.dataset.day));
    });
  }

  function updatePlanStatus(id, newStatus) {
    const plan = state.plans.find((item) => item.id === Number(id));
    const previousStatus = plan.status;
    const adult = adultById(plan.adultId);
    plan.status = newStatus;
    plan.reviewedBy = currentUser().name;
    if (newStatus === "Asignado" && adult) notifyPlanAssignment(plan, adult);
    addAudit(currentUser().name, "Cambio estado plan", "exercise_plans", plan.title + " -> " + newStatus);
    saveState();
    renderPlans();
    toast(newStatus === "Asignado"
      ? (previousStatus === "Asignado" ? "Notificacion del plan reenviada." : "Plan asignado y notificaciones enviadas.")
      : "Plan actualizado a " + newStatus + ".");
  }

  function saveExerciseTracking(planId, day) {
    const plan = state.plans.find((item) => item.id === Number(planId));
    const exercise = plan?.exercises.find((item) => item.day === day);
    if (!plan || !exercise) return;
    const selector = `[data-plan="${planId}"][data-day="${day}"]`;
    const statusInput = document.querySelector(`.exercise-status${selector}`);
    const complianceInput = document.querySelector(`.exercise-compliance${selector}`);
    const observationsInput = document.querySelector(`.exercise-observations${selector}`);
    exercise.status = statusInput.value;
    exercise.compliance = Math.max(0, Math.min(100, Number(complianceInput.value) || 0));
    exercise.observations = observationsInput.value.trim();
    if (exercise.status === "Completado" && exercise.compliance === 0) exercise.compliance = 100;
    if (exercise.status === "Omitido") exercise.compliance = 0;
    plan.adherence = Math.round(plan.exercises.reduce((sum, item) => sum + Number(item.compliance || 0), 0) / plan.exercises.length);
    state.activityLogs.unshift({
      id: Date.now(),
      adultId: plan.adultId,
      date: new Date().toISOString().slice(0, 10),
      planId: plan.id,
      exercise: exercise.name,
      status: exercise.status,
      minutes: exercise.status === "Completado" ? parseInt(exercise.duration, 10) || 0 : 0,
      notes: exercise.observations || `Cumplimiento ${exercise.compliance}%`
    });
    addAudit(currentUser().name, "Registro seguimiento plan", "exercise_tracking", `${exercise.day}: ${exercise.compliance}%`);
    saveState();
    renderPlans();
    toast("Seguimiento de actividad guardado.");
  }

  function renderTracking() {
    document.getElementById("content").innerHTML = `
      <section class="section">
        <div class="section-header">
          <div><h2>Adultos en seguimiento</h2><span class="muted">Selecciona un adulto mayor para abrir su seguimiento con graficas, plan y bitacora.</span></div>
          <button class="button" id="addActivity">Registrar actividad</button>
        </div>
        <div class="grid three">
          ${visibleAdults().map((adult) => trackingAdultCard(adult)).join("")}
        </div>
        <div id="trackingDetail"></div>
      </section>
    `;
    document.querySelectorAll(".tracking-adult").forEach((card) => {
      card.addEventListener("click", () => renderTrackingDetail(Number(card.dataset.id)));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          renderTrackingDetail(Number(card.dataset.id));
        }
      });
    });
    document.getElementById("addActivity").addEventListener("click", () => {
      const selectedId = Number(document.getElementById("trackingDetail").dataset.adultId || visibleAdults()[0]?.id);
      const plan = state.plans.find((item) => item.adultId === selectedId) || state.plans[0];
      const exercise = plan.exercises.find((item) => item.status === "Pendiente") || plan.exercises[0];
      exercise.status = "Completado";
      plan.adherence = Math.round((plan.exercises.filter((item) => item.status === "Completado").length / plan.exercises.length) * 100);
      state.activityLogs.unshift({ id: Date.now(), adultId: plan.adultId, date: new Date().toISOString().slice(0, 10), planId: plan.id, exercise: exercise.name, status: "Completado", minutes: 12, notes: "Actividad registrada desde seguimiento." });
      addAudit(currentUser().name, "Registro actividad", "activity_logs", exercise.name);
      saveState();
      renderTracking();
      renderTrackingDetail(plan.adultId);
      toast("Actividad registrada y cumplimiento recalculado.");
    });
    const firstAdult = visibleAdults()[0];
    if (firstAdult) renderTrackingDetail(firstAdult.id);
  }

  function trackingAdultCard(adult) {
    const logs = state.activityLogs.filter((item) => item.adultId === adult.id);
    const completed = logs.filter((item) => item.status === "Completado").length;
    const omitted = logs.filter((item) => item.status === "Omitido").length;
    return `
      <article class="card click-card tracking-adult" data-id="${adult.id}" tabindex="0" role="button" aria-label="Abrir seguimiento de ${escapeHtml(fullName(adult))}">
        <div class="section-header"><h2>${escapeHtml(fullName(adult))}</h2>${status(adult.status)}</div>
        <p class="muted">${escapeHtml(adult.risk)} | Consentimiento ${escapeHtml(adult.consent)}</p>
        <div class="progress" aria-label="${adult.adherence}%"><span style="width:${adult.adherence}%"></span></div>
        <p><strong>${adult.adherence}%</strong> de cumplimiento</p>
        <p class="muted">${completed} completadas | ${omitted} omitidas | ${logs.length} registros</p>
      </article>
    `;
  }

  function renderTrackingDetail(adultId) {
    const adult = adultById(adultId);
    const detail = document.getElementById("trackingDetail");
    if (!adult || !detail) return;
    const logs = state.activityLogs.filter((item) => item.adultId === adult.id);
    const plan = state.plans.find((item) => item.adultId === adult.id);
    const completed = logs.filter((item) => item.status === "Completado").length;
    const omitted = logs.filter((item) => item.status === "Omitido").length;
    const pending = plan ? plan.exercises.filter((item) => item.status === "Pendiente").length : 0;
    detail.dataset.adultId = adult.id;
    detail.innerHTML = `
      <section class="section">
        <div class="section-header">
          <div>
            <h2>Seguimiento de ${escapeHtml(fullName(adult))}</h2>
            <span class="muted">Plan vigente, cumplimiento, tendencia y bitacora diaria.</span>
          </div>
          <a class="button secondary" href="adult-detail.html?id=${adult.id}">Ver ficha integral</a>
        </div>
        <div class="grid four">
          ${metric("Cumplimiento", adult.adherence + "%", "Adherencia general")}
          ${metric("Completadas", completed, "Actividades registradas")}
          ${metric("Pendientes", pending, "Ejercicios del plan")}
          ${metric("Omitidas", omitted, "Requieren seguimiento")}
        </div>
        <div class="charts-grid">
          ${donutChart("Estado del seguimiento", { Completado: completed, Pendiente: pending, Omitido: omitted })}
          ${lineChart("Evolucion individual", adultTrendSeries(adult))}
          ${barChart("Plan semanal", plan ? plan.exercises.map((exercise) => ({ label: exercise.day, value: exercise.status === "Completado" ? 100 : exercise.status === "Omitido" ? 0 : 45 })) : [], "%")}
          ${barChart("Minutos registrados", logs.map((log) => ({ label: log.date, value: log.minutes })), " min", "alt")}
        </div>
        <article class="card">
          <h2>Bitacora de ${escapeHtml(fullName(adult))}</h2>
          ${activityTable(logs)}
        </article>
      </section>
    `;
  }

  function adultTrendSeries(adult) {
    const base = Math.max(20, adult.adherence - 24);
    return [
      { label: "S1", value: base },
      { label: "S2", value: Math.min(100, base + 7) },
      { label: "S3", value: Math.min(100, base + 13) },
      { label: "S4", value: Math.min(100, adult.adherence - 4) },
      { label: "S5", value: adult.adherence }
    ];
  }

  function activityTable(items) {
    return table(["Fecha", "Adulto", "Ejercicio", "Estado", "Minutos", "Notas"], items.map((item) => [
      item.date,
      fullName(adultById(item.adultId)),
      item.exercise,
      status(item.status),
      item.minutes,
      item.notes
    ]));
  }

  function renderAlerts() {
    document.getElementById("content").innerHTML = `
      <section class="grid two">
        <article class="card">
          <div class="section-header"><h2>Historial de notificaciones</h2><button class="button" id="sendAlert">Enviar recordatorio</button></div>
          ${table(["Fecha", "Destino", "Tipo", "Estado", "Contenido"], state.notifications.map((item) => [item.date, item.to, item.type, status(item.status), item.content]))}
        </article>
        <article class="card">
          <h2>Reglas de alerta</h2>
          <p>${status("Activa")} Falta de cumplimiento por 2 dias consecutivos.</p>
          <p>${status("Activa")} SFT con riesgo alto o caida reportada.</p>
          <p>${status("Activa")} Consentimiento pendiente o vencido.</p>
        </article>
      </section>
    `;
    document.getElementById("sendAlert").addEventListener("click", () => {
      state.notifications.unshift({ id: Date.now(), to: "Claudia Mendez", type: "Recordatorio", status: "Enviada", date: new Date().toISOString().slice(0, 16).replace("T", " "), content: "Recordatorio de ejercicio programado." });
      addAudit(currentUser().name, "Envio notificacion", "notifications", "Recordatorio de ejercicio");
      saveState();
      renderAlerts();
      toast("Recordatorio enviado.");
    });
  }

  function renderReports() {
    document.getElementById("content").innerHTML = `
      <section class="grid three">
        ${metric("Frecuencia semanal", "4.1", "Actividades promedio")}
        ${metric("Adherencia", Math.round(state.plans.reduce((sum, plan) => sum + plan.adherence, 0) / state.plans.length) + "%", "Planes activos")}
        ${metric("SFT registrados", state.sftResults.length, "Historial funcional")}
      </section>
      <section class="charts-grid">
        ${barChart("Adherencia comparativa", visibleAdults().map((adult) => ({ label: fullName(adult), value: adult.adherence })), "%")}
        ${lineChart("Evolucion del estudio", trendSeries())}
        ${donutChart("Distribucion de actividades", exerciseStatusCounts())}
        ${barChart("Indicadores SFT", sftScoreSeries(), " pts", "alt")}
        ${barChart("Consentimientos por estado", consentSeries(), "", "warn")}
        ${barChart("Alertas y notificaciones", notificationSeries(), "", "alt")}
      </section>
      <section class="card chart">
        <h2>Mapa semanal de cumplimiento</h2>
        ${heatmap()}
      </section>
      <section class="card">
        <div class="section-header"><h2>Reporte exportable</h2><button class="button" id="exportCsv">Exportar CSV</button></div>
        ${adultsTable(visibleAdults())}
      </section>
    `;
    document.getElementById("exportCsv").addEventListener("click", () => {
      const csv = ["nombre,estado,consentimiento,cumplimiento"].concat(visibleAdults().map((adult) => `${fullName(adult)},${adult.status},${adult.consent},${adult.adherence}%`)).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "tybacha-reporte.csv";
      link.click();
      URL.revokeObjectURL(link.href);
      addAudit(currentUser().name, "Exporto reporte", "reports", "CSV de adultos mayores");
      saveState();
    });
  }

  function renderConsents() {
    document.getElementById("content").innerHTML = `
      <section class="section">
        <div class="section-header"><h2>Control de consentimiento</h2><button class="button" id="addConsent">Registrar consentimiento</button></div>
        ${table(["Adulto", "Tipo", "Estado", "Fecha", "Vence", "Firmado por"], state.consents.map((item) => [
          fullName(adultById(item.adultId)),
          item.type,
          status(item.status),
          item.date,
          item.expiresAt || "Pendiente",
          item.signedBy
        ]))}
      </section>
    `;
    document.getElementById("addConsent").addEventListener("click", () => {
      const adult = visibleAdults()[0];
      state.consents.unshift({ id: Date.now(), adultId: adult.id, type: "Tratamiento de datos sensibles", status: "Vigente", date: new Date().toISOString().slice(0, 10), expiresAt: "2027-05-12", signedBy: fullName(adult) });
      adult.consent = "Vigente";
      addAudit(currentUser().name, "Registro consentimiento", "consents", fullName(adult));
      saveState();
      renderConsents();
      toast("Consentimiento registrado.");
    });
  }

  function renderAudit() {
    document.getElementById("content").innerHTML = `
      <section class="section">
        <div class="section-header"><h2>Trazabilidad de accesos y cambios</h2><span class="muted">Quien, cuando y que dato se modifico.</span></div>
        ${table(["Fecha", "Usuario", "Accion", "Entidad", "Detalle"], state.auditLogs.map((item) => [item.date, item.user, item.action, item.entity, item.detail]))}
      </section>
    `;
  }

  function renderSettings() {
    document.getElementById("content").innerHTML = `
      <section class="grid two">
        <article class="card">
          <h2>Infraestructura objetivo</h2>
          <p><strong>Backend:</strong> Node.js + Express REST API, JWT, bcrypt, logs estructurados y manejo robusto de errores.</p>
          <p><strong>Base de datos:</strong> TiDB Cloud compatible con MySQL, pool SSL, migraciones, backup y recuperacion.</p>
          <p><strong>IA:</strong> Gemini para planes personalizados, recomendaciones y prediccion de progreso.</p>
        </article>
        <article class="card">
          <h2>Operaciones</h2>
          <p>${status("Activo")} Monitoreo Vercel/Firebase</p>
          <p>${status("Activo")} Politicas de privacidad y retencion</p>
          <p>${status("Pendiente")} Sincronizacion offline/online para app Expo</p>
          <button class="button secondary" id="resetDemo">Restablecer datos demo</button>
        </article>
      </section>
    `;
    document.getElementById("resetDemo").addEventListener("click", () => {
      localStorage.removeItem(storageKey);
      toast("Datos demo restablecidos. Recarga la pagina.");
    });
  }

  function table(headers, rows) {
    if (!rows.length) return `<div class="empty">Sin registros para mostrar.</div>`;
    return `
      <div class="table-wrap">
        <table>
          <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      </div>
    `;
  }

  function barChart(title, items, suffix = "", variant = "") {
    const safeItems = items.length ? items : [{ label: "Sin datos", value: 0 }];
    const max = Math.max(100, ...safeItems.map((item) => Number(item.value) || 0));
    return `
      <article class="card chart">
        <h2>${escapeHtml(title)}</h2>
        <div class="bar-chart">
          ${safeItems.map((item) => {
            const value = Number(item.value) || 0;
            const width = Math.max(3, Math.round((value / max) * 100));
            return `
              <div class="bar-row">
                <span>${escapeHtml(item.label)}</span>
                <div class="bar-track"><span class="bar-fill ${variant}" style="width:${width}%"></span></div>
                <strong>${value}${escapeHtml(suffix)}</strong>
              </div>
            `;
          }).join("")}
        </div>
      </article>
    `;
  }

  function donutChart(title, counts) {
    const completed = counts.Completado || 0;
    const pending = counts.Pendiente || 0;
    const omitted = counts.Omitido || 0;
    const total = completed + pending + omitted || 1;
    const completedEnd = Math.round((completed / total) * 100);
    const pendingEnd = Math.round(((completed + pending) / total) * 100);
    return `
      <article class="card chart">
        <h2>${escapeHtml(title)}</h2>
        <div class="donut-wrap">
          <div class="donut" data-label="${completedEnd}%" style="--value:${completedEnd}%; --value2:${pendingEnd}%"></div>
          <div class="legend">
            <span class="legend-item"><span class="swatch success"></span>Completados: ${completed}</span>
            <span class="legend-item"><span class="swatch warning"></span>Pendientes: ${pending}</span>
            <span class="legend-item"><span class="swatch danger"></span>Omitidos: ${omitted}</span>
          </div>
        </div>
      </article>
    `;
  }

  function lineChart(title, series) {
    const points = series.length ? series : [{ label: "Semana 1", value: 0 }];
    const width = 520;
    const height = 220;
    const padding = { top: 24, right: 24, bottom: 34, left: 42 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const max = Math.max(100, ...points.map((point) => Number(point.value) || 0));
    const coords = points.map((point, index) => {
      const x = padding.left + (points.length === 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
      const y = padding.top + chartHeight - ((Number(point.value) || 0) / max) * chartHeight;
      return { ...point, x, y };
    });
    const path = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    const area = `${path} L ${coords[coords.length - 1].x} ${height - padding.bottom} L ${coords[0].x} ${height - padding.bottom} Z`;
    const gridLines = [0, 25, 50, 75, 100].map((value) => {
      const y = padding.top + chartHeight - (value / 100) * chartHeight;
      return `<line class="line-grid" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line><text class="line-label" x="8" y="${y + 4}">${value}%</text>`;
    }).join("");
    return `
      <article class="card chart">
        <h2>${escapeHtml(title)}</h2>
        <span class="muted">Porcentaje promedio de actividades completadas por semana.</span>
        <div class="line-chart">
          <svg class="line-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(title)}">
            ${gridLines}
            <path class="line-area" d="${area}"></path>
            <path class="line-path" d="${path}"></path>
            ${coords.map((point) => `
              <circle class="line-dot" cx="${point.x}" cy="${point.y}" r="6"></circle>
              <text class="line-value" x="${point.x}" y="${Math.max(14, point.y - 12)}" text-anchor="middle">${point.value}%</text>
              <text class="line-label" x="${point.x}" y="${height - 10}" text-anchor="middle">${escapeHtml(point.label)}</text>
            `).join("")}
          </svg>
        </div>
      </article>
    `;
  }

  function heatmap() {
    const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
    const rows = state.plans.map((plan) => {
      const adult = adultById(plan.adultId);
      const cells = days.map((day) => {
        const exercise = plan.exercises.find((item) => item.day === day);
        const value = exercise?.status === "Completado" ? 100 : exercise?.status === "Omitido" ? 0 : 45;
        const level = value >= 80 ? "high" : value >= 40 ? "mid" : "low";
        return `<div class="heat-cell ${level}">${value}%</div>`;
      }).join("");
      return `<strong>${escapeHtml(fullName(adult))}</strong>${cells}`;
    }).join("");
    return `<div class="heatmap"><span></span>${days.map((day) => `<strong>${day}</strong>`).join("")}${rows}</div>`;
  }

  function exerciseStatusCounts() {
    return state.plans.flatMap((plan) => plan.exercises).reduce((acc, exercise) => {
      acc[exercise.status] = (acc[exercise.status] || 0) + 1;
      return acc;
    }, {});
  }

  function trendSeries() {
    return [
      { label: "S1", value: 48 },
      { label: "S2", value: 56 },
      { label: "S3", value: 64 },
      { label: "S4", value: 71 },
      { label: "S5", value: Math.round(state.plans.reduce((sum, plan) => sum + plan.adherence, 0) / state.plans.length) || 0 }
    ];
  }

  function sftScoreSeries() {
    return state.sftResults.map((item) => ({
      label: fullName(adultById(item.adultId)),
      value: item.chairStand + item.armCurl + Math.round(item.twoMinuteStep / 5) + Math.max(0, 15 - Math.round(item.eightFootUpGo))
    }));
  }

  function consentSeries() {
    return ["Vigente", "Pendiente", "Vencido", "Revocado"].map((label) => ({
      label,
      value: state.consents.filter((item) => item.status === label).length
    }));
  }

  function notificationSeries() {
    return ["Enviada", "Recibida", "Leida"].map((label) => ({
      label,
      value: state.notifications.filter((item) => item.status === label).length
    }));
  }

  function age(birthDate) {
    const birth = new Date(birthDate);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const month = today.getMonth() - birth.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) years -= 1;
    return years;
  }

  function addAudit(user, action, entity, detail) {
    state.auditLogs.unshift({
      id: Date.now(),
      user,
      action,
      entity,
      detail,
      date: new Date().toISOString().slice(0, 16).replace("T", " ")
    });
  }
})();
