// inventory.js
(function () {
    const inventoryContainer = document.querySelector('.gifts-inventory .gifts-blocks');

    if (!inventoryContainer) return;

    // --- Рендер подарков в инвентаре ---
    window.renderInventory = function (gifts = []) {
        inventoryContainer.innerHTML = ''; // очищаем перед рендером
        gifts.forEach((gift, index) => {
            const item = document.createElement('div');
            item.className = 'gifts-block__item';
            item.dataset.index = index;

            const img = document.createElement('img');
            img.className = 'gift-item__gif';
            img.src = gift.img;
            img.alt = gift.label;

            const desc = document.createElement('h2');
            desc.className = 'gift-desc';
            desc.textContent = gift.label;

            const btnWrapper = document.createElement('div');
            btnWrapper.className = 'gift-buttons';

            const btnTake = document.createElement('button');
            btnTake.className = 'btn__take-gift';
            btnTake.textContent = 'Take';

            const btnSell = document.createElement('button');
            btnSell.className = 'btn__sale-gift';
            btnSell.textContent = 'Sell';

            btnWrapper.appendChild(btnTake);
            btnWrapper.appendChild(btnSell);

            item.appendChild(img);
            item.appendChild(desc);
            item.appendChild(btnWrapper);

            inventoryContainer.appendChild(item);

            // --- Обработчики кнопок ---
            btnTake.addEventListener('click', () => {
                showMessage('Function not available yet!', 'error');
            });

            btnSell.addEventListener('click', async () => {
                const stars = parseInt(gift.label.match(/\d+/)[0], 10) || 0;

                // Обновляем локальный баланс
                window.userBalance += stars;
                document.getElementById('stars-balance').textContent = `${window.userBalance} ⭐`;

                // Удаляем подарок из DOM
                item.remove();

                // Отправка на сервер (MongoDB)
                try {
                    await fetch('/api/user/sell-gift', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ telegramId: window.telegramId, gift })
                    });
                } catch (err) {
                    console.error('Error selling gift:', err);
                }

                showMessage(`Gift sold: +${stars} ⭐`, 'success');
            });
        });
    };

    // --- Сообщения ---
    let messageContainer = document.getElementById('inventory-messages');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'inventory-messages';
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

    let isMessageActive = false;

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

    window.showMessage = showMessage;
})();
