// Shared helpers for the page scripts. Loaded before each page's script.

const capitalize = (str) =>
  String(str).substring(0, 1).toUpperCase() + String(str).substring(1);

// Create an element with text content (never HTML) to keep user data inert
const createEl = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
};

// Render one result card: a heading plus "Label: value" lines
const createCard = (id, title, lines) => {
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
const fetchJSON = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const message = (await response.text()) || response.statusText;
    throw new Error(message);
  }
  return response.json();
};

const postJSON = (url, data) =>
  fetchJSON(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

// Build a query string, skipping empty values and encoding the rest
const toQueryString = (formData) => {
  const params = new URLSearchParams();
  Object.entries(formData).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.append(key, value);
  });
  return params.toString();
};
