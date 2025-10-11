document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.section-header__blocks');
  const searchInput = document.getElementById('searchInput');
  const suggestionsList = document.getElementById('suggestionsList');
  const noResults = document.getElementById('noResults');

  // Индикатор загрузки
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'loading';
  loadingIndicator.style.cssText = `
    display:none;
    text-align:center;
    margin:30px 0;
    color:#fff;
    font-weight:500;
  `;
  loadingIndicator.textContent = 'Loading...';
  container.after(loadingIndicator);

  let allAds = [];
  let displayedCount = 0;
  const batchSize = 10;
  let hashtags = [];
  let isLoading = false;

  // Загружаем JSON
  fetch('ads.json')
    .then(res => res.json())
    .then(adData => {
      allAds = adData;
      hashtags = [...new Set(allAds.flatMap(ad => ad.tags))];
      loadNextBatch();
    });

  // Создание блока рекламы
  function createBlock(ad) {
    const block = document.createElement('div');
    block.classList.add('ad-block');
    block.dataset.tag = ad.tags.join(' ');

    const headContent = ad.image
      ? `<img class="ad-block__img" src="${ad.image}" alt="${ad.title}">`
      : `<video class="ad-block__video" src="${ad.video}" autoplay muted loop playsinline></video>`;

    const hashtagsHTML = ad.tags
      .map(tag => `<div class="${tag === "#recommended" ? 'hashtag-recommended' : 'ad-block__hashtag'}">${tag}</div>`)
      .join('');

    block.innerHTML = `
      <div class="ad-block__head">${headContent}</div>
      <div class="ad-block__bottom">
        <div class="ad-block__title">${ad.title}</div>
        <div class="ad-block__description">
          <div class="ad-block__username">${ad.username}</div>
          <div class="ad-block__desc block-bottom__item">${ad.desc}</div>
          <div class="ad-block__hashtags">${hashtagsHTML}</div>
          <a href="${ad.link}" class="ad-link ad-link__mobile block-bottom__item">Subscribe ${ad.reward}</a>
        </div>
      </div>
    `;

    // кликабельные хештеги
    block.querySelectorAll('.ad-block__hashtag, .hashtag-recommended').forEach(tag => {
      tag.style.cursor = 'pointer';
      tag.addEventListener('click', () => {
        const tagText = tag.textContent.trim();
        window.showPage('page-ad');
        searchInput.value = tagText;
        suggestionsList.style.display = 'none';
        searchInput.dispatchEvent(new Event('input'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    container.appendChild(block);
  }

  // Подгрузка следующей партии
  function loadNextBatch() {
    if (isLoading || displayedCount >= allAds.length) return;
    isLoading = true;
    loadingIndicator.style.display = 'block';

    const nextAds = allAds.slice(displayedCount, displayedCount + batchSize);

    setTimeout(() => {
      nextAds.forEach(ad => createBlock(ad));
      displayedCount += nextAds.length;
      loadingIndicator.style.display = 'none';
      isLoading = false;
    }, 700); // имитация загрузки
  }

  // Обработка поиска
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    suggestionsList.innerHTML = '';

    if (!query) {
      document.querySelectorAll('.ad-block').forEach(b => (b.style.display = ''));
      noResults.style.display = 'none';
      return;
    }

    const normalizedQuery = query.startsWith('#') ? query : `#${query}`;
    const filtered = hashtags.filter(tag =>
      tag.toLowerCase().includes(normalizedQuery.replace('#', ''))
    );

    if (filtered.length) {
      filtered.forEach(tag => {
        const li = document.createElement('li');
        li.textContent = tag;
        li.addEventListener('click', () => {
          searchInput.value = tag;
          suggestionsList.style.display = 'none';
          searchInput.dispatchEvent(new Event('input'));
        });
        suggestionsList.appendChild(li);
      });
      suggestionsList.style.display = 'block';
    } else {
      suggestionsList.style.display = 'none';
    }

    // Если нужных каналов еще нет — загружаем до конца
    if (displayedCount < allAds.length) {
      const hasPotentialMatch = allAds.some(ad => {
        const title = ad.title.toLowerCase();
        const tags = ad.tags.map(t => t.toLowerCase());
        return title.includes(query) || tags.some(t => t.includes(query.replace('#', '')));
      });

      if (hasPotentialMatch) loadUntilMatch(query);
    }

    // фильтруем блоки
    let found = 0;
    document.querySelectorAll('.ad-block').forEach(block => {
      const tagsAttr = block.dataset.tag || '';
      const tags = tagsAttr.split(' ').map(t => t.trim().toLowerCase());
      const title = block.querySelector('.ad-block__title')?.textContent.toLowerCase() || '';
      const match =
        tags.some(tag => tag.includes(query.replace('#', ''))) ||
        title.includes(query.replace('#', ''));
      block.style.display = match ? '' : 'none';
      if (match) found++;

      // подсветка совпадающих тегов
      block.querySelectorAll('.ad-block__hashtag').forEach(h => {
        h.classList.remove('highlight');
        if (query && h.textContent.toLowerCase().includes(query.replace('#', ''))) {
          h.classList.add('highlight');
        }
      });
    });

    noResults.style.display = found === 0 ? 'block' : 'none';
  });

  // Загружает, пока не появится нужный тег/канал
  function loadUntilMatch(query) {
    const interval = setInterval(() => {
      const prevDisplayed = displayedCount;
      loadNextBatch();
      if (displayedCount === prevDisplayed || displayedCount >= allAds.length) {
        clearInterval(interval);
      }
    }, 800);
  }

  // Подгрузка при прокрутке
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
      loadNextBatch();
    }
  });
});
