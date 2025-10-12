function createCase({
  id,              // уникальный id для контейнеров
  cost,            // стоимость
  prizes,          // массив призов
  buttonId,        // id кнопки
  resultId,        // id для текста результата
  stripId,         // id полосы (ленты)
  viewportId       // id вьюпорта (области)
}) {
  const ITEM_WIDTH = 100;
  const GAP = 5;
  const FULL_W = ITEM_WIDTH + GAP;
  const REPEAT = 40;
  const BASE_ROTATIONS = 4;
  const DURATION = 6500;

  const strip = document.getElementById(stripId);
  const viewport = document.getElementById(viewportId);
  const btn = document.getElementById(buttonId);
  const resultEl = document.getElementById(resultId);

  let totalItems = prizes.length * REPEAT;

  // === СОЗДАНИЕ ЛЕНТЫ ===
  function buildStrip() {
    strip.innerHTML = '';
    for (let r = 0; r < REPEAT; r++) {
      for (const p of prizes) {
        const el = document.createElement('div');
        el.className = 'item';
        const img = document.createElement('img');
        img.src = p.img;
        img.alt = p.label;
        img.style.width = '70px';
        img.style.height = '70px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        el.appendChild(img);
        strip.appendChild(el);
      }
    }
    strip.style.transform = 'translateX(0px)';
    strip.dataset.x = '0';
  }

  buildStrip();

  function weightedChoice(list) {
    const total = list.reduce((s, a) => s + Math.max(0, a.weight || 0), 0);
    if (total <= 0) return null;
    let r = Math.random() * total, acc = 0;
    for (let i = 0; i < list.length; i++) {
      acc += list[i].weight;
      if (r < acc) return i;
    }
    return list.length - 1;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // === КНОПКА СПИН ===
  btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    btn.disabled = true;

    if (window.userBalance < cost) {
      resultEl.textContent = `Not enough stars`;
      btn.disabled = false;
      return;
    }

    // снимаем звезды
    const res = await fetch("/api/user/spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: window.telegramId, cost })
    });

    const data = await res.json();
    if (data.error) {
      resultEl.textContent = data.error;
      btn.disabled = false;
      return;
    }

    window.userBalance = data.balance;
    document.getElementById('stars-balance').textContent = `${window.userBalance} ⭐`;

    const choice = weightedChoice(prizes);
    if (choice === null) {
      resultEl.textContent = 'Error: no prizes';
      btn.disabled = false;
      return;
    }

    const from = parseFloat(strip.dataset.x || '0');
    const vpCenter = viewport.clientWidth / 2;
    const currentCenterIndex = Math.round((-from + vpCenter - ITEM_WIDTH / 2) / FULL_W);
    let baseRepeat = Math.floor(currentCenterIndex / prizes.length);
    let targetRepeat = baseRepeat + BASE_ROTATIONS + 1;
    let targetIndex = targetRepeat * prizes.length + choice;
    const maxSafeIndex = totalItems - prizes.length - 1;

    if (targetIndex > maxSafeIndex) {
      targetRepeat = Math.floor(REPEAT / 2);
      targetIndex = targetRepeat * prizes.length + choice;
      if (targetIndex <= currentCenterIndex) {
        targetIndex = Math.min(maxSafeIndex, currentCenterIndex + prizes.length);
      }
    }

    const elementX = targetIndex * FULL_W;
    const targetTranslate = vpCenter - elementX - (ITEM_WIDTH / 2);
    let final = targetTranslate;
    if (Math.abs(final - from) < 0.5) {
      const loopW = prizes.length * FULL_W;
      final -= loopW * (1 + Math.floor(Math.random() * 3));
    }

    const start = performance.now();
    function raf(now) {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = easeOutCubic(t);
      const cur = from + (final - from) * eased;
      strip.style.transform = `translateX(${cur}px)`;

      if (t < 1) requestAnimationFrame(raf);
      else {
        strip.style.transform = `translateX(${final}px)`;
        strip.dataset.x = String(final);
        const prize = prizes[choice];
        resultEl.textContent = `🎉 You won: ${prize.label}`;
        btn.disabled = false;
      }
    }
    requestAnimationFrame(raf);
  });
}
