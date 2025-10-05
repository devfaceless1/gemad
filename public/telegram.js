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

            const channelUsername = channelUrl.replace('https://t.me/', '').replace('/', '');

            if (window.subscribedChannels.has(channelUsername)) {
                showMessage('You already received stars for this channel!', 'error');
                return;
            }

            const starsMatch = link.textContent.match(/\d+(\.\d+)?/);
            const starsToAdd = starsMatch ? parseFloat(starsMatch[0]) : 0;

            await updateBalance(starsToAdd, channelUsername);
            showMessage(`You earned ${starsToAdd} ⭐!`, 'success');

            // Открываем канал внутри Telegram
            tg.openLink(`https://t.me/${channelUsername}`);

        });
    });

    // =====================
    // Сообщения (уведомления)
    // =====================
    let messageContainer = document.getElementById('telegram-messages');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'telegram-messages';
        document.body.appendChild(messageContainer);
        Object.assign(messageContainer.style, {
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column-reverse',
            alignItems: 'center',
            gap: '10px',
            pointerEvents: 'none',
        });
    }

    let isMessageActive = false; // 🚫 Антиспам

    function showMessage(text, type = 'message', duration = 2000) {
        if (isMessageActive) return;
        isMessageActive = true;

        const msg = document.createElement('div');
        msg.textContent = text;

        let bgColor = '#2196f3';
        if (type === 'success') bgColor = '#4caf50';
        if (type === 'error') bgColor = '#e53935';

        Object.assign(msg.style, {
            padding: '14px 24px',
            background: bgColor,
            color: '#fff',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '15px',
            textAlign: 'center',
            minWidth: '220px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
        });

        messageContainer.appendChild(msg);

        requestAnimationFrame(() => {
            msg.style.opacity = '1';
            msg.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            msg.style.opacity = '0';
            msg.style.transform = 'translateY(20px)';
            setTimeout(() => {
                msg.remove();
                isMessageActive = false;
            }, 300);
        }, duration);
    }

    window.updateBalance = updateBalance;
})();
