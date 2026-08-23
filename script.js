// Элементы DOM
const queryInput = document.getElementById('query');
const searchBtn = document.getElementById('searchBtn');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');

// Базовый URL Jikan API (v4). Ключ не нужен, лимит ~3 запроса/сек
const BASE_URL = 'https://api.jikan.moe/v4/anime';

// Задержка (используется между повторными попытками)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Запрос с автоповтором при временных ошибках сервера (503, 504)
async function fetchWithRetry(url, attempts = 3, waitMs = 1000) {
  for (let i = 0; i < attempts; i++) {
    const response = await fetch(url);

    // Успех — сразу возвращаем
    if (response.ok) return response;

    // Временная ошибка сервера — ждём и пробуем снова
    if ((response.status === 504 || response.status === 503) && i < attempts - 1) {
      statusEl.textContent = `Сервер занят, повторная попытка (${i + 1}/${attempts})...`;
      await delay(waitMs);
      continue;
    }

    // Другая ошибка или попытки закончились
    throw new Error(`Ошибка сервера: ${response.status}`);
  }
}

// Основная функция запроса к API
async function searchAnime() {
  const query = queryInput.value.trim();
  if (!query) return;

  statusEl.textContent = 'Загрузка...';
  resultsEl.innerHTML = '';

  try {
    const url = `${BASE_URL}?q=${encodeURIComponent(query)}&limit=12&order_by=score&sort=desc`;
    const response = await fetchWithRetry(url);
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      statusEl.textContent = 'Ничего не найдено 😔';
      return;
    }

    statusEl.textContent = `Найдено: ${data.data.length}`;
    renderCards(data.data);

  } catch (err) {
    statusEl.textContent = 'Ошибка загрузки: ' + err.message + '. Попробуй ещё раз через пару секунд.';
    console.error(err);
  }
}

// Отрисовка карточек в DOM
function renderCards(animeList) {
  resultsEl.innerHTML = animeList.map(anime => `
    <div class="card">
      <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
      <div class="card-body">
        <h3>${anime.title}</h3>
        <p>${anime.type || '—'} · ${anime.episodes || '?'} эп.</p>
        <span class="score">⭐ ${anime.score ?? 'N/A'}</span>
      </div>
    </div>
  `).join('');
}

// Обработчики событий
searchBtn.addEventListener('click', searchAnime);

queryInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchAnime();
});

// Первый запрос при загрузке страницы
searchAnime();
