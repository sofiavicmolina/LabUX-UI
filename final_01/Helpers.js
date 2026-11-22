/* 
   1. Configuración y estado inicial
    */
const CONFIG = {
  apiBaseUrl: "/api",
  debug: true,
};

const state = {
  isLoading: false,
  user: null,
};

/* 
   2. Utilidades / Helpers
    */
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

function log(...args) {
  if (CONFIG.debug) {
    console.log("[App]:", ...args);
  }
}

async function request(endpoint, options = {}) {
  const url = `${CONFIG.apiBaseUrl}${endpoint}`;
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(url, {
      headers: { ...defaultHeaders, ...options.headers },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    log("Error en request:", error.message);
    throw error;
  }
}

/* 
   3. Manejadores de eventos y UI
    */
function bindEvents() {
  // Delegación de eventos a nivel de documento
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    log("Acción ejecutada:", action);

    switch (action) {
      case "ejemplo":
        handleEjemplo(button);
        break;
      default:
        log("Acción sin manejador:", action);
    }
  });
}

function handleEjemplo(button) {
  button.classList.toggle("is-active");
}

/* 
   4. Inicialización de la aplicación
   */
function init() {
  log("Inicializando aplicación...");
  bindEvents();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}