document.addEventListener('touchstart', (e) => {
  window._startY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  const touchY = e.touches[0].clientY;
  const diff = touchY - (window._startY || 0);

  if (window.scrollY <= 0 && diff > 0) {
    e.preventDefault(); 
  }
}, { passive: false });

document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram.WebApp;
  tg.expand();

  const header = document.querySelector(".section__page-ad");
  const container = document.querySelector(".section-header__blocks");
  const searchInput = document.getElementById("searchInput");
  const suggestionsList = document.getElementById("suggestionsList");
  const noResults = document.getElementById("noResults");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const updateButton = document.querySelector(".update-list__button");

  let allAds = [];
  let displayedCount = 0;
  const batchSize = 10;
  let hashtags = [];
  let loading = false;
  let allLoaded = false;
  let isSearching = false;
  let currentQuery = "";
  let isRefreshing = false;
  let currentSearchToken = 0;

  // === LOADING INDICATOR ===
  const loadingIndicator = document.createElement("div");
  loadingIndicator.id = "loading";
  loadingIndicator.innerHTML = `<div class="spinner"></div>`;
  loadingIndicator.style.cssText = `
    display:none; text-align:center; padding:20px; color:#fff;
  `;
  container.parentElement.appendChild(loadingIndicator);

  // === REFRESH INDICATOR ===
  const refreshIndicator = document.createElement("div");
  refreshIndicator.id = "refreshIndicator";
  refreshIndicator.innerHTML = `
<svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fff">
  <path d="M3 12C3 16.9706 7.02944 21 12 21C14.3051 21 16.4077 20.1334 18 18.7083L21 16M21 12C21 7.02944 16.9706 3 12 3C9.69494 3 7.59227 3.86656 6 5.29168L3 8M21 21V16M21 16H16M3 3V8M3 8H8" stroke="#1e2533" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
</svg>
  `;
  refreshIndicator.style.cssText = `
    position: absolute;
    top: 30px;
    left: 50%;
    transform: translate(-50%, -100%);
    opacity: 0;
    transition: transform 0.2s ease, opacity 0.2s ease;
    z-index: 2;
    width: 30px;
    height: 30px;
  `;
  document.body.appendChild(refreshIndicator);

  const style = document.createElement("style");
  style.innerHTML = `
    #refreshIndicator.refreshing svg {
      animation: spin 1s linear infinite;
      transform-origin: 50% 50%;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);

  // === FETCH ADS ===
  fetch("ads.json")
    .then(res => res.json())
    .then(adData => {
      allAds = adData;
      hashtags = [...new Set(allAds.flatMap(ad => ad.tags))];
      shuffleAds();
      loadNextBatch();
    });

  function shuffleAds() {
    allAds.sort(() => Math.random() - 0.5);
  }

  function createBlock(ad) {
    const block = document.createElement("div");
    block.classList.add("ad-block");
    block.dataset.tag = ad.tags.join(" ");

    const headContent = ad.image
      ? `<img class="ad-block__img" src="${ad.image}" alt="${ad.title}">`
      : ad.video
      ? `<video class="ad-block__video" src="${ad.video}" autoplay muted loop playsinline></video>`
      : "";

    const hashtagsHTML = ad.tags
      .map(tag => `<div class="${tag === "#recommended" ? "hashtag-recommended" : "ad-block__hashtag"}">${tag}</div>`)
      .join("");

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

    block.querySelectorAll(".ad-block__hashtag, .hashtag-recommended").forEach(tag => {
      tag.style.cursor = "pointer";
      tag.addEventListener("click", () => {
        searchInput.value = tag.textContent.trim();
        suggestionsList.style.display = "none";
        searchInput.dispatchEvent(new Event("input"));
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

    container.appendChild(block);
  }

  function highlightTags(query) {
    const clean = (query || "").toLowerCase().replace(/^#/, "");
    container.querySelectorAll(".ad-block").forEach(block => {
      block.querySelectorAll(".ad-block__hashtag, .hashtag-recommended").forEach(h => {
        h.classList.remove("highlight");
        if (clean && h.textContent.toLowerCase().includes(clean)) {
          h.classList.add("highlight");
        }
      });
    });
  }

  function loadNextBatch() {
    if (loading || allLoaded || isSearching) return;

    loading = true;
    const nextAds = allAds.slice(displayedCount, displayedCount + batchSize);
    if (!nextAds.length) { allLoaded = true; loading = false; return; }

    loadingIndicator.style.display = "block";
    setTimeout(() => {
      if (isSearching) { loadingIndicator.style.display = "none"; loading = false; return; }
      nextAds.forEach(ad => createBlock(ad));
      displayedCount += nextAds.length;
      loadingIndicator.style.display = "none";
      loading = false;
      highlightTags(currentQuery);
    }, 500);
  }

  window.addEventListener("scroll", () => {
    if (!loading && !allLoaded && !isSearching &&
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
      loadNextBatch();
    }
  });

  // === PULL TO REFRESH ===
  let startY = 0, pulling = false, pullOffset = 0;
  function isPullEnabled() {
    const activePage = document.querySelector(".page.active");
    return activePage && activePage.id === "page-ad";
  }

  window.addEventListener("touchstart", e => {
    if (!isPullEnabled() || window.scrollY > 0 || isRefreshing) return;
    startY = e.touches[0].pageY; pulling = true;
  });

  window.addEventListener("touchmove", e => {
    if (!pulling || !isPullEnabled()) return;
    const diff = e.touches[0].pageY - startY;
    if (diff > 0) {
      e.preventDefault();
      pullOffset = Math.min(diff / 3, 60);
      header.style.transform = `translateY(${pullOffset}px)`;
      refreshIndicator.style.transform = `translate(-50%, ${pullOffset}px)`;
      refreshIndicator.style.opacity = "1";
      refreshIndicator.querySelector("svg").style.transform = `rotate(${Math.min(pullOffset*4,360)}deg)`;
    }
  });

  window.addEventListener("touchend", e => {
    if (!pulling || !isPullEnabled()) return;
    pulling = false;
    const diff = e.changedTouches[0].pageY - startY;

    header.style.transition = "transform 0.3s ease";
    refreshIndicator.style.transition = "transform 0.3s ease, opacity 0.3s ease";

    if (diff < 50) {
      header.style.transform = "";
      refreshIndicator.style.transform = "translate(-50%, -100%)";
      refreshIndicator.style.opacity = "0";
      return;
    }

    isRefreshing = true;
    refreshIndicator.classList.add("refreshing");
    refreshIndicator.style.transform = `translate(-50%, ${pullOffset}px)`;
    refreshIndicator.style.opacity = "1";

    setTimeout(() => {
      container.innerHTML = "";
      displayedCount = 0;
      allLoaded = false;
      shuffleAds();
      loadNextBatch();
      isRefreshing = false;
      header.style.transform = "";
      refreshIndicator.classList.remove("refreshing");
      refreshIndicator.style.transform = "translate(-50%, -100%)";
      refreshIndicator.style.opacity = "0";
    }, 1200);
  });

  // === SEARCH ===
  searchInput.addEventListener("input", () => {
    const token = ++currentSearchToken;
    currentQuery = searchInput.value.trim();
    const queryLower = currentQuery.toLowerCase();

    isSearching = currentQuery.length > 0;
    suggestionsList.innerHTML = "";

    // Show suggestions
    // Show suggestions
if (isSearching) {
  const filteredTags = hashtags.filter(tag =>
    tag.toLowerCase().includes(queryLower.replace(/^#/, ""))
  );
  
  filteredTags.slice(0, 10).forEach(tag => {
    const li = document.createElement("li");
    li.textContent = tag;
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      // Ставим выбранную подсказку в инпут
      searchInput.value = tag;
      currentQuery = tag;
      suggestionsList.style.display = "none";

      // Сразу показываем результаты по выбранной подсказке
      isSearching = true;
      container.innerHTML = "";
      const matched = allAds.filter(ad => {
        const title = (ad.title || "").toLowerCase();
        const tags = (ad.tags || []).map(t => t.toLowerCase());
        return title.includes(tag.toLowerCase()) || tags.some(t => t.includes(tag.toLowerCase()));
      });

      if (matched.length) {
        matched.forEach(ad => createBlock(ad));
        noResults.style.display = "none";
      } else {
        noResults.style.display = "block";
      }
      highlightTags(currentQuery);
      clearSearchBtn.style.display = "block";
    });
    suggestionsList.appendChild(li);
  });

  suggestionsList.style.display = filteredTags.length ? "block" : "none";
} else {
  suggestionsList.style.display = "none";
}


    container.innerHTML = "";
    noResults.style.display = "none";

    if (isSearching) {
      const matched = allAds.filter(ad => {
        const title = (ad.title || "").toLowerCase();
        const tags = (ad.tags || []).map(t => t.toLowerCase());
        const clean = queryLower.replace(/^#/, "");
        return title.includes(clean) || tags.some(t => t.includes(clean));
      });

      setTimeout(() => {
        if (token !== currentSearchToken) return; // ignore outdated
        container.innerHTML = "";
        if (matched.length) matched.forEach(ad => createBlock(ad));
        noResults.style.display = matched.length ? "none" : "block";
        highlightTags(currentQuery);
      }, 0);

    } else {
      displayedCount = 0;
      allLoaded = false;
      loadNextBatch();
      noResults.style.display = "none";
    }

    clearSearchBtn.style.display = currentQuery ? "block" : "none";
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    suggestionsList.style.display = "none";
    noResults.style.display = "none";

    container.innerHTML = "";
    displayedCount = 0;
    allLoaded = false;
    isSearching = false;
    currentQuery = "";
    loadNextBatch();
  });

  // === REFRESH BUTTON ===
  if (updateButton) {
    updateButton.addEventListener("click", () => {
      const svg = updateButton.querySelector("svg");
      if (!svg) return;
      svg.classList.add("rotating");
      refreshAds(true);
      setTimeout(() => svg.classList.remove("rotating"), 1500);
    });
  }

  function refreshAds(fromButton = false) {
  if (isRefreshing) return;
  isRefreshing = true;

  
  clearSearchBtn.style.display = "none";

  if (!fromButton) {
    refreshIndicator.classList.add("refreshing");
    refreshIndicator.style.transform = "translate(-50%, 60px)";
    refreshIndicator.style.opacity = "1";
  }

  setTimeout(() => {
    container.innerHTML = "";
    displayedCount = 0;
    allLoaded = false;
    isSearching = false;
    currentQuery = "";
    searchInput.value = "";
    noResults.style.display = "none";

    shuffleAds();
    loadNextBatch();

    if (!fromButton) {
      refreshIndicator.classList.remove("refreshing");
      refreshIndicator.style.transform = "translate(-50%, -100%)";
      refreshIndicator.style.opacity = "0";
    }

    isRefreshing = false;
  }, 1200);
}

// === FOOTER HIDE ON KEYBOARD ===
const footer = document.querySelector(".footer-nav");
let initialHeight = window.innerHeight;
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (footer && isMobile) {
  window.addEventListener("resize", () => {
    const newHeight = window.innerHeight;

    if (newHeight < initialHeight - 100) {
  
      footer.style.transition = "transform 0.3s ease, opacity 0.3s ease";
      footer.style.transform = "translateY(100%)";
      footer.style.opacity = "0";
    } else {
 
      footer.style.transition = "transform 0.3s ease, opacity 0.3s ease";
      footer.style.transform = "translateY(0)";
      footer.style.opacity = "1";
      initialHeight = newHeight;
    }
  });
}


});
