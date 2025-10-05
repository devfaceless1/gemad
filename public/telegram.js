(function () {
    const tg = window.Telegram.WebApp;
    tg.expand();

    const user = tg.initDataUnsafe?.user;
    if (!user) throw new Error('Telegram user not found');

    const telegramId = user.id.toString();
    const firstName = user.first_name;
    const username = user.username;
    const avatarUrl = user.photo_url || (user.username ? `https://t.me/i/userpic/320/${user.username}.jpg` : '');

    // Сохраняем telegramId глобально, чтобы spin.js и другие скрипты могли его использовать
    window.telegramId = telegramId;

    // Элементы UI
    const starsBalanceEl = document.getElementById('stars-balance');
    const nameEl = document.getElementById('name');
    const avatarEl = document.getElementById('avatar');

    nameEl.textContent = firstName;
    avatarEl.src = avatarUrl;

    window.userBalance = 0;

    // Инициализация пользователя
    async function initUser() {
        const res = await fetch('/api/user/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramId, firstName, username, avatarUrl })
        });
        const data = await res.json();
        window.userBalance = data.balance || 0;
        starsBalanceEl.textContent = `${window.userBalance} ⭐`;

        // Загружаем подписки, если они сохраняются на сервере
        window.subscribedChannels = new Set(data.subscribedChannels || []);
    }

    initUser();

    // Обновление баланса
    async function updateBalance(delta, channelUsername = null) {
        const res = await fetch('/api/user/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramId, delta, channel: channelUsername })
        });
        const data = await res.json();
        window.userBalance = data.balance;
        starsBalanceEl.textContent = `${window.userBalance} ⭐`;
        if (channelUsername) window.subscribedChannels.add(channelUsername);
    }

    // Подписка на каналы
    document.querySelectorAll('.ad-link').forEach(link => {
    link.addEventListener('click', async (e) => {
        e.preventDefault();
        const channelUrl = link.getAttribute('href');
        if (!channelUrl || channelUrl === '#') return;

        // Берем username канала из ссылки
        const channelUsername = channelUrl.replace('https://t.me/', '').replace('/', '');

        // Проверяем, не начисляли ли уже звезды за этот канал
        if (window.subscribedChannels.has(channelUsername)) {
            showMessage('You already received stars for this channel!', 'error');
            return;
        }

        // Получаем количество звезд из текста кнопки
        const starsMatch = link.textContent.match(/\d+(\.\d+)?/);
        const starsToAdd = starsMatch ? parseFloat(starsMatch[0]) : 0;

        // Обновляем баланс на сервере
        await updateBalance(starsToAdd, channelUsername);
        showMessage(`You earned ${starsToAdd} ⭐!`, 'success');

        // Открываем канал внутри Telegram без перехода в браузер
        tg.openChat(channelUsername);
    });
});

    // Сообщения
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

    window.updateBalance = updateBalance;
})();
