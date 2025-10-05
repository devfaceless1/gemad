(function () {
    const tgWebApp = window.Telegram && window.Telegram.WebApp;
    const tg = tgWebApp;
    tg.expand();

    window.userBalance = 0;
    const starsBalanceEl = document.getElementById('stars-balance');

    function updateBalanceUI() {
        if (starsBalanceEl) starsBalanceEl.textContent = `${window.userBalance} ⭐`;
    }

    updateBalanceUI();

    const subscribedChannels = new Set();

    // Контейнер для сообщений
    let messageContainer = document.getElementById('telegram-messages');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'telegram-messages';
        document.body.appendChild(messageContainer);
        Object.assign(messageContainer.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            pointerEvents: 'none',
        });
    }

    function showMessage(text, type = 'message', duration = 1500) {
        const msg = document.createElement('div');
        msg.textContent = text;
        Object.assign(msg.style, {
            padding: '12px 20px',
            background: type === 'success' ? '#4caf50' : '#ff4c4c',
            color: '#fff',
            borderRadius: '8px',
            fontWeight: '600',
            textAlign: 'center',
            minWidth: '200px',
        });
        messageContainer.appendChild(msg);
        setTimeout(() => msg.remove(), duration);
    }

    // Подписка на каналы
    document.querySelectorAll('.ad-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const channelUrl = link.getAttribute('href');
            if (!channelUrl || channelUrl === '#') return;

            if (subscribedChannels.has(channelUrl)) {
                showMessage('You already received stars for this channel!', 'error');
                return;
            }

            const starsMatch = link.textContent.match(/\d+(\.\d+)?/);
            const starsToAdd = starsMatch ? parseFloat(starsMatch[0]) : 0;

            window.userBalance += starsToAdd;
            updateBalanceUI();
            subscribedChannels.add(channelUrl);
            showMessage(`You earned ${starsToAdd} ⭐!`, 'success');

            // Открываем канал
            window.open(channelUrl, '_blank');
        });
    });

    // Отображение пользователя
    const user = tg.initDataUnsafe?.user;
    if (user) {
        window.telegramId = user.id; // Сохраняем для API спина
        const nameEl = document.getElementById('name');
        if (nameEl) nameEl.textContent = user.first_name || 'User';

        const avatarEl = document.getElementById('avatar');
        if (avatarEl) {
            if (user.photo_url) avatarEl.src = user.photo_url;
            else if (user.username) avatarEl.src = `https://t.me/i/userpic/320/${user.username}.jpg`;
        }

        const starsEarnedEl = document.getElementById('stars-earned');
        if (starsEarnedEl) starsEarnedEl.textContent = '0 Stars earned';
    }
})();
