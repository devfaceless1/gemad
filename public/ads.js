(async function() {
    const container = document.querySelector('.section-header__blocks');
    if (!container) return;

    const res = await fetch('/ads.json');
    const ads = await res.json();

    ads.forEach(ad => {
 
        const a = document.createElement('a');
        a.href = ad.link;
        a.className = 'ad-link';
        a.target = '_blank'; 
        a.dataset.reward = parseInt(ad.reward) || 0;

        a.innerHTML = `
            <div class="ad-block">
                <div class="ad-block__head">
                    ${ad.image ? `<img class="ad-block__img" src="${ad.image}" alt="${ad.title}">` : ''}
                    ${ad.video ? `<video class="ad-block__video" src="${ad.video}" autoplay muted loop></video>` : ''}
                </div>
                <div class="ad-block__bottom">
                    <h2 class="ad-block__title">${ad.title}</h2>
                    <p class="ad-block__desc">${ad.desc}</p>
                    <div class="ad-block__reward">Reward: ${ad.reward}</div>
                </div>
            </div>
        `;

        container.appendChild(a);
    });

    document.querySelectorAll('.ad-link').forEach(link => {
    link.addEventListener('click', async (e) => {
        e.preventDefault();
        const channelUrl = link.href;
        if (!channelUrl || channelUrl === '#') return;

        const channelUsername = channelUrl.replace('https://t.me/', '').replace('/', '');

        if (window.subscribedChannels.has(channelUsername)) {
            showMessage('You already received stars for this channel!', 'error');
            return;
        }

        const starsToAdd = parseInt(link.dataset.reward) || 0;
        if (starsToAdd > 0) {
            await window.updateBalance(starsToAdd, channelUsername);
            showMessage(`You earned ${starsToAdd} ⭐!`, 'success');
        }

        // --- Открываем канал в Telegram и закрываем мини-приложение ---
        const tg = window.Telegram.WebApp;
        tg.close(); // сворачиваем мини-ап
        tg.openLink(`https://t.me/${channelUsername}`); // открываем канал
    });
});

})();
