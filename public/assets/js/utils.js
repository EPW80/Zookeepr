// @ts-check
// Shared helpers for the page scripts.

/**
 * @typedef {{ id: string, name: string, species: string, diet: string, personalityTraits: string[] }} Animal
 * @typedef {{ id: string, name: string, age: number, favoriteAnimal: string }} Zookeeper
 */

/**
 * Find an element, failing loudly if the page doesn't have it. The element
 * type comes from the variable it's assigned to.
 * @template {Element} [T=HTMLElement]
 * @param {string} selector
 * @param {ParentNode} [root]
 * @returns {T}
 */
export const $ = (selector, root = document) => {
  const el = root.querySelector(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return /** @type {T} */ (el);
};

/** @param {unknown} str */
export const capitalize = (str) =>
  String(str).substring(0, 1).toUpperCase() + String(str).substring(1);

// Create an element with text content (never HTML) to keep user data inert
/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {string} [className]
 * @param {string} [text]
 * @returns {HTMLElementTagNameMap[K]}
 */
export const createEl = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
};

// Render one result card: a heading plus "Label: value" lines
/**
 * @param {string} id
 * @param {string} title
 * @param {Array<[string, string | number]>} lines
 */
export const createCard = (id, title, lines) => {
  const col = createEl("div", "col-12 col-md-5 mb-3");
  const card = createEl("div", "card p-3");
  card.dataset.id = id;
  card.append(createEl("h4", "text-primary", title));

  const p = createEl("p");
  lines.forEach(([label, value], i) => {
    if (i > 0) p.append(createEl("br"));
    p.append(`${label}: ${value}`);
  });
  card.append(p);

  col.append(card);
  return col;
};

// fetch() wrapper that rejects on non-2xx responses so callers can't
// accidentally treat a failure as success
/**
 * @template T
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<T>}
 */
export const fetchJSON = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    // Error bodies are either plain text or JSON like { "error": "..." }
    const text = await response.text();
    let message = text || response.statusText;
    try {
      message = JSON.parse(text).error || message;
    } catch {
      // not JSON; use the text as-is
    }
    throw new Error(message);
  }
  return /** @type {Promise<T>} */ (response.json());
};

/**
 * @template T
 * @param {string} url
 * @param {unknown} data
 * @returns {Promise<T>}
 */
export const postJSON = (url, data) =>
  fetchJSON(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

// Build a query string, skipping empty values and encoding the rest
/** @param {Record<string, string | undefined>} formData */
export const toQueryString = (formData) => {
  const params = new URLSearchParams();
  Object.entries(formData).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.append(key, value);
  });
  return params.toString();
};

// Show a success or error message in the page's #flash element
/** @type {ReturnType<typeof setTimeout> | undefined} */
let hideTimer;
/**
 * @param {string} text
 * @param {"success" | "info" | "error"} [kind]
 */
export const showMessage = (text, kind = "success") => {
  const flash = $("#flash");
  flash.textContent = text;
  flash.className = `flash flash-${kind}`;
  flash.hidden = false;
  flash.scrollIntoView({ block: "nearest", behavior: "smooth" });
  clearTimeout(hideTimer);
  // Errors stay until the next message; successes fade after a few seconds
  if (kind === "success") {
    hideTimer = setTimeout(() => {
      flash.hidden = true;
    }, 5000);
  }
};

export const hideMessage = () => {
  $("#flash").hidden = true;
};
