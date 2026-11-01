// Shared helpers for the page scripts.

export const capitalize = (str) =>
  String(str).substring(0, 1).toUpperCase() + String(str).substring(1);

// Create an element with text content (never HTML) to keep user data inert
export const createEl = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
};

// Render one result card: a heading plus "Label: value" lines
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
  return response.json();
};

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
export const toQueryString = (formData) => {
  const params = new URLSearchParams();
  Object.entries(formData).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.append(key, value);
  });
  return params.toString();
};

// Show a success or error message in the page's #flash element
let hideTimer;
export const showMessage = (text, kind = "success") => {
  const flash = document.querySelector("#flash");
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
  document.querySelector("#flash").hidden = true;
};
