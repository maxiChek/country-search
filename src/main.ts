import { createSearchController } from './searchController.js';
import { searchCountries } from './searchCountries.js';
import type { CountryCard } from './mapCountryResponse.js';

// ---------- UI Initialization ----------

function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  attributes?: Record<string, string>,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      el.setAttribute(key, value);
    }
  }
  return el;
}

function initUI() {
  const app = createElement('main', 'app');

  const title = createElement('h1');
  title.textContent = 'Country Search';

  const searchContainer = createElement('div', 'search');
  const label = createElement('label', 'visually-hidden', { for: 'search-input' });
  label.textContent = 'Search countries';

  const searchInput = createElement('input', '', {
    id: 'search-input',
    type: 'search',
    placeholder: 'Start typing a country name…',
    autocomplete: 'off',
    spellcheck: 'false',
    'aria-describedby': 'search-status',
  });

  const historyEl = createElement('div', 'search-history', { id: 'search-history' });
  searchContainer.append(label, searchInput, historyEl);

  const statusEl = createElement('div', 'status', {
    id: 'search-status',
    role: 'status',
    'aria-live': 'polite',
  });
  const resultsEl = createElement('ul', 'results', {
    id: 'results',
    'aria-label': 'Country search results',
  });

  // --- Detailed View (Dialog) ---
  const dialog = createElement('dialog', 'country-dialog', { id: 'country-dialog' });
  const dialogContent = createElement('div', 'dialog-content');
  const dialogClose = createElement('button', 'dialog-close', {
    type: 'button',
    'aria-label': 'Close',
  });
  dialogClose.textContent = '×';

  const dialogImg = createElement('img', 'dialog-flag', { alt: '' });
  const dialogName = createElement('h2', 'dialog-name');
  const dialogMeta = createElement('p', 'dialog-meta');
  const dialogLanguages = createElement('p', 'dialog-languages');

  dialogContent.append(dialogClose, dialogImg, dialogName, dialogMeta, dialogLanguages);
  dialog.append(dialogContent);

  app.append(title, searchContainer, statusEl, resultsEl, dialog);
  document.body.append(app);

  return {
    searchInput,
    statusEl,
    resultsEl,
    historyEl,
    dialog,
    dialogClose,
    dialogImg,
    dialogName,
    dialogMeta,
    dialogLanguages,
  };
}

const {
  searchInput,
  statusEl,
  resultsEl,
  historyEl,
  dialog,
  dialogClose,
  dialogImg,
  dialogName,
  dialogMeta,
  dialogLanguages,
} = initUI();

// ---------- Search History ----------

const HISTORY_KEY = 'country-search-history';
const MAX_HISTORY = 5;

function getHistory(): string[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToHistory(query: string): void {
  const normalized = query.trim();
  if (!normalized) return;

  let history = getHistory();
  history = history.filter((q) => q.toLowerCase() !== normalized.toLowerCase());
  history.unshift(normalized);
  history = history.slice(0, MAX_HISTORY);

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Ignore write errors
  }
  renderHistory();
}

function renderHistory(): void {
  historyEl.replaceChildren();
  const history = getHistory();
  if (history.length === 0) return;

  history.forEach((query) => {
    const chip = createElement('button', 'history-chip', { type: 'button' });
    chip.textContent = query;
    chip.addEventListener('click', () => {
      searchInput.value = query;
      controller.search(query);
    });
    historyEl.append(chip);
  });
}

// ---------- UI Updates ----------

function setLoading(loading: boolean): void {
  if (!loading) return;

  statusEl.replaceChildren();
  statusEl.className = 'status';

  const spinner = createElement('span', 'spinner', { 'aria-hidden': 'true' });
  const label = createElement('span');
  label.textContent = 'Searching…';
  statusEl.append(spinner, label);
}

function showCountryDetails(card: CountryCard): void {
  dialogImg.src = card.flag;
  dialogImg.alt = `Flag of ${card.name}`;
  dialogName.textContent = card.name;
  dialogMeta.textContent = `Capital: ${card.capital} • Region: ${card.region} • Population: ${card.population.toLocaleString()}`;

  if (card.languages.length > 0) {
    dialogLanguages.textContent = `Languages: ${card.languages.join(', ')}`;
    dialogLanguages.style.display = 'block';
  } else {
    dialogLanguages.style.display = 'none';
  }

  dialog.showModal();
}

function createCardNode(card: CountryCard): HTMLLIElement {
  const node = createElement('li', 'country-card');
  node.tabIndex = 0; // Make focusable for keyboard users
  node.setAttribute('role', 'button');

  const img = createElement('img', 'country-card__flag', {
    alt: `Flag of ${card.name}`,
    loading: 'lazy',
    width: '48',
    height: '32',
  });
  img.src = card.flag;

  const body = createElement('div', 'country-card__body');
  const name = createElement('h2', 'country-card__name');
  name.textContent = card.name;

  const meta = createElement('p', 'country-card__meta');
  meta.textContent = [card.capital, card.region].filter(Boolean).join(' • ');

  body.append(name, meta);
  node.append(img, body);

  // Add click and keyboard listeners for detailed view
  node.addEventListener('click', () => showCountryDetails(card));
  node.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showCountryDetails(card);
    }
  });

  return node;
}

function renderResults(cards: CountryCard[]): void {
  resultsEl.replaceChildren();
  statusEl.replaceChildren();
  statusEl.className = 'status';

  if (cards.length === 0) {
    const p = createElement('p', 'status--empty');
    p.textContent = 'No countries found.';
    statusEl.append(p);
    return;
  }

  if (searchInput.value.trim()) {
    saveToHistory(searchInput.value);
  }

  const fragment = document.createDocumentFragment();
  for (const card of cards) {
    fragment.append(createCardNode(card));
  }
  resultsEl.append(fragment);
}

function renderError(error: unknown, retry: () => void): void {
  resultsEl.replaceChildren();
  statusEl.replaceChildren();
  statusEl.className = 'status status--error';

  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  const p = createElement('p');
  p.textContent = `Something went wrong: ${errorMessage}`;

  const retryBtn = createElement('button', 'retry-btn', { type: 'button' });
  retryBtn.textContent = 'Retry';
  retryBtn.addEventListener('click', retry, { once: true });

  statusEl.append(p, retryBtn);
}

// ---------- Controller Setup ----------

const controller = createSearchController({
  searchFn: searchCountries,
  onResults: renderResults,
  onError: (error) => {
    renderError(error, () => controller.search(searchInput.value));
  },
  onLoadingChange: setLoading,
  debounceMs: 300,
  timeoutMs: 10000,
});

// ---------- Event Listeners ----------

searchInput.addEventListener('input', (event) => {
  const query = (event.target as HTMLInputElement).value;
  controller.search(query);
});

dialogClose.addEventListener('click', () => dialog.close());

// Close dialog when clicking on the backdrop (outside the content area)
dialog.addEventListener('click', (e) => {
  const rect = dialog.getBoundingClientRect();
  const isInDialog =
    rect.top <= e.clientY &&
    e.clientY <= rect.top + rect.height &&
    rect.left <= e.clientX &&
    e.clientX <= rect.left + rect.width;
  if (!isInDialog) {
    dialog.close();
  }
});

window.addEventListener('pagehide', () => {
  controller.dispose();
});

renderHistory();
searchInput.focus();
