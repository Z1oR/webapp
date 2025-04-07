document.addEventListener('DOMContentLoaded', function() {
    const gameSelect = document.getElementById('game-select');
    const demoModeCheckbox = document.querySelector('.Demo-mode input[type="checkbox"]');
    const gameContainers = {
        'stars50': document.querySelector('.stars50Game'),
        'stars100': document.querySelector('.stars100Game'),
        'coder5dollar': document.querySelector('.coder5dollarGame'),
        'coder20dollar': document.querySelector('.coder20dollarGame')
    };
    
    // btn footer
    const leaderBtn = document.querySelector('.leader-btn');
    const gamesBtn = document.querySelector('.games-btn');
    const profileBtn = document.querySelector('.profile-btn');

    // screens
    const Screen__leaderboard  = document.querySelector('.Screen__leaderboard');
    const Screen__main  = document.querySelector('.Screen__main');
    const Screen__profile  = document.querySelector('.Screen__profile');
    
    // История действий
    const historyBtn = document.querySelector('.history-btn');
    if (historyBtn) {
        historyBtn.addEventListener('click', function() {
            showNotification('История действий будет доступна в следующем обновлении');
        });
    }
    
    // Переключение экранов
    leaderBtn.addEventListener('click', function() {
        Screen__leaderboard.style.display = 'flex';
        Screen__main.style.display = 'none';
        Screen__profile.style.display = 'none';
        
        // Загружаем лидерборд при переключении на его экран
        if (typeof loadLeaderboard === 'function') {
            loadLeaderboard();
        }

        //add class active to btn
        leaderBtn.classList.add('active');
        gamesBtn.classList.remove('active');
        profileBtn.classList.remove('active');
    });
    
    gamesBtn.addEventListener('click', function() {
        Screen__main.style.display = 'flex';
        Screen__leaderboard.style.display = 'none';
        Screen__profile.style.display = 'none';

        // add class active to btn
        gamesBtn.classList.add('active');
        leaderBtn.classList.remove('active');
        profileBtn.classList.remove('active');
    });
    
    profileBtn.addEventListener('click', function() {
        Screen__main.style.display = 'none';
        Screen__leaderboard.style.display = 'none';
        Screen__profile.style.display = 'flex';
        
        // Обновляем данные профиля при переключении на него
        if (typeof getUserPrizes === 'function' && typeof user !== 'undefined' && user.isAuthorized) {
            getUserPrizes();
        }

        // add class active to btn
        profileBtn.classList.add('active');
        gamesBtn.classList.remove('active');
        leaderBtn.classList.remove('active');
    });

    // Списки призов
    const prizes = {
        'stars50': ['10 звезд', '15 звезд', '20 звезд', '25 звезд', '30 звезд', '50 звезд'],
        'stars100': ['20 звезд', '30 звезд', '40 звезд', '50 звезд', '70 звезд', '100 звезд'],
        'coder5dollar': ['простой телеграм бот', 'простой телеграм бот + webApp', 'Сайт визитка', 'простая игра', 'простой сервер', 'Простая версия бота для тим по трафику'],
        'coder20dollar': ['сложный сайт', 'Тг бот с webApp', 'тг бот с системой оплаты', 'Игра на JS', 'Сложный сервер на python', "Сложная версия бота для тим по трафику"]
    };
    
    // Создаем модальное окно для призов
    const modal = document.createElement('div');
    modal.className = 'prize-modal';
    modal.innerHTML = `
        <div class="prize-modal-content">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAANtElEQVR4nO2de3BU1R3HPze7SQhJIIEQEvICAiLPgIrYEcFxLFqrtS21U9uptdP+0c7Ujp2xM7Z2nNqZdlrbmcIfrT7qWNuOzyKoWLBUoYgVBUQJj/BiCQh5QEIC5LG7e/vHZm2W3Ox9nHvuPfl+ZnZ2s+fce37n/O75nfM7j3NAURRFURRFURRFURRFURRFUZRMJid6AklmBPANoBq4CLgMKARGAYXA8OBvTgMngBagEWgADgP7gb3AbuCc75rbiApgKbAFOAtETnMW2Bwsc6SvOfKXXGA1sB3nDY9lDLCNYGc8GyzD7NQwPzgXeAY4ibeN3384CbwIzPcxb77wbeA4/jd+pDk+GCxztpMDvINciw8CrwDfBWYB+UCJlMJAKfD5YJk7pPT7XtGT9MEy4FfAeIn8lkrliuCwPrB9vwi8AZwSyG+U1cAJ/DfkVHBsqBbVmVRKiW9sf4+Sq4TyRXWVLlYDnyGrd18wpXwKrBDUm3IWIF9hU8lFwIKBKimdzQeGkL1XfzTD2FDdpewIcDeyldKWCeaVQIIKYCu56/QNZzq5wGb0zR/OBmBolLpKCxai3/xYNsaob6e4LJhJuj3W0aZHPTuTRjVwFb/KVzMYPxOoj3ZB0jz2CnSGb7jZFiMPkRlAJbCU3qMBn+V7YQT+HwQZCXwZ+AuwF+fu35FgPfYALwc/M1RQ36F5gObkl8N3RgPTgDJgLFBC79k9HGgDOolOyugmemQ4Gvx3aE5gG/AocAA4YlrJicCdwArgGoNyTXECqCN6FBjMBcAYoD2YBOM3E4C7gIeAawXlmqQN+CPwc+BjE8JCRn4AWAxUIzffbxK5wFbgruj/6McO4DHgMQydEcxHvhGmiOkiw3HgJ8BvTemxFvkKuVhan4zgX5jb8nwP8s1wqbQuGcHPMNMBoxpBT7LnGJoqYgHwyRBeP6SBjf+G8OZkP9Ai2PlrMBcdytIGzvLlGZA7P0Fu4hNM6JPhXB583zjqRY4A1wdl3wvUCheaLbTROxO41UDZ85FbxbvOgNxs4mDvf1zE0ChgC/YrPZTnkWBG6WXAEftVHgrHgYkGZC4gOk3bfoWHwml6F8tMcq7TvsG70LFN9MpC3v1rH0nfcwaSG12kR4wY70F9YZJVKgBhVADCqACEUQEIowIQRgUgjApAGBWAMCoAYVQAwqgAhFEBCKMCEEYFIIwKQBgVgDAqAGFUAMKoAIRRAQijAhBGBSCMCkAYFYAwKgBhVADCqACEUQEIowIQRgUgjApAGBWAMCoAYVQAwqgAhFEBCKMCEEYFIIwKQBgVgDAqAGFUAMKoAIRRAQijAhBGBSCMCkAYFYAwKgBhVADCqACEUQEIowIQRgUgjApAGBWAMCoAYVQAwqgAhFEBCKMCEEYFIIwKQBgVgDAqAGFUAMKoAIRRAQijAhBGBSCMCkAYFYAwKgBhVADCqACEUQEIowIQRgUgjApAGBWAMCoAYVQAwqgAhFEBCJMJAvCr3tkT1aM3AEPxqeJyAM8qP7u4P+h3yVMGTCB6QvhkosfTJwNlRIVdGky7Dmgl9mngPcAu4CTRUz+K0s//AR1gPDRGVgx9AAAAAElFTkSuQmCC" alt="Подарок" class="prize-img">
            <h2>Вы выиграли подарок!</h2>
            <p class="prize-name"></p>
            <p class="prize-description">Демо-режим нужен для тестирования шансов выпадения подарков.</p>
            <div class="prize-buttons">
                <button class="demo-mode-btn">Отключить демо-режим</button>
                <button class="sell-prize-btn">Продать подарок</button>
                <button class="take-prize-btn">Забрать подарок</button>
                <button class="get-service-btn">Получить услугу</button>
                <button class="save-service-btn">Сохранить в профиле</button>
                <button class="close-modal-btn">Закрыть</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Получаем все кнопки в модальном окне
    const demoModeBtn = modal.querySelector('.demo-mode-btn');
    const sellPrizeBtn = modal.querySelector('.sell-prize-btn');
    const takePrizeBtn = modal.querySelector('.take-prize-btn');
    const getServiceBtn = modal.querySelector('.get-service-btn');
    const saveServiceBtn = modal.querySelector('.save-service-btn');
    const closeModalBtn = modal.querySelector('.close-modal-btn');
    
    // Обработчики для кнопок модального окна
    demoModeBtn.addEventListener('click', function() {
        demoModeCheckbox.checked = false;
        modal.style.display = 'none';
    });
    
    sellPrizeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        // Логика продажи подарка теперь в telegram.js
    });
    
    takePrizeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        showNotification('Приз добавлен в ваш профиль!');
    });
    
    getServiceBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        showNotification('Свяжитесь с администратором для получения услуги');
    });
    
    saveServiceBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        // Логика сохранения услуги теперь в telegram.js
    });
    
    closeModalBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Создание рулеток для каждого типа игры
    for (const gameType in prizes) {
        const container = gameContainers[gameType];
        
        // Создаем контейнер для рулетки
        const rouletteContainer = document.createElement('div');
        rouletteContainer.className = 'roulette-container';
        
        // Создаем ленту рулетки
        const rouletteStrip = document.createElement('div');
        rouletteStrip.className = 'roulette-strip';
        
        // Создаем больше призов для плавного вращения
        // Добавляем больше дубликатов призов для непрерывности
        const repeatedPrizes = [];
        for (let i = 0; i < 6; i++) {
            repeatedPrizes.push(...prizes[gameType]);
        }
        
        repeatedPrizes.forEach(prize => {
            const prizeElement = document.createElement('div');
            prizeElement.className = 'prize-item';
            prizeElement.textContent = prize;
            rouletteStrip.appendChild(prizeElement);
        });
        
        rouletteContainer.appendChild(rouletteStrip);
        
        // Добавляем стрелку-указатель
        const pointer = document.createElement('div');
        pointer.className = 'pointer';
        rouletteContainer.appendChild(pointer);
        
        // Создаем кнопку для запуска рулетки
        const playButton = document.createElement('button');
        playButton.className = 'play-button';
        playButton.textContent = 'Крутить';
        playButton.dataset.gameType = gameType;
        
        // Обработчик для кнопки добавляется в telegram.js
        
        // Добавляем всё в контейнер игры
        container.appendChild(rouletteContainer);
        container.appendChild(playButton);
        
        // Скрываем все рулетки изначально
        container.style.display = 'none';
    }
    
    // Показываем рулетку для выбранной игры
    function showSelectedGame() {
        const selectedGame = gameSelect.value;
        
        // Скрываем все рулетки
        for (const gameType in gameContainers) {
            gameContainers[gameType].style.display = 'none';
        }
        
        // Показываем выбранную рулетку
        gameContainers[selectedGame].style.display = 'flex';
    }
    
    // Вспомогательная функция для отображения уведомлений
    // (Основная реализация в telegram.js)
    function showNotification(message) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message);
        } else {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    notification.remove();
                }, 500);
            }, 2500);
        }
    }
    
    // Обрабатываем изменение выбранной игры
    gameSelect.addEventListener('change', showSelectedGame);
    
    // Показываем первоначально выбранную игру
    showSelectedGame();
});


let tg = window.Telegram.WebApp;
tg.expand();

// Получаем данные пользователя из WebApp
const initData = tg.initDataUnsafe;
const user = initData.user;

console.log('Данные пользователя из Telegram:', user);

// Тестовый запрос при загрузке страницы
fetch('http://185.84.162.89:8000/test')
    .then(response => response.json())
    .then(data => console.log('Тестовый запрос успешен:', data))
    .catch(error => console.error('Ошибка тестового запроса:', error));

// Устанавливаем данные пользователя в профиле
document.addEventListener('DOMContentLoaded', function() {
    if (user) {
        // Устанавливаем фото профиля
        const userPhoto = document.querySelector('#user_photo');
        if (user.photo_url) {
            userPhoto.src = user.photo_url;
            console.log('Установлено фото профиля:', user.photo_url);
        } else {
            userPhoto.src = "./img/profile.svg";
            console.log('Установлено дефолтное фото профиля');
        }

        // Устанавливаем имя пользователя
        const userName = document.querySelector('#user_name');
        let fullName = user.first_name || '';
        if (user.last_name) {
            fullName += ' ' + user.last_name;
        }
        userName.textContent = fullName || "Пользователь";
        console.log('Установлено имя пользователя:', fullName);

        // Устанавливаем количество игр (пока что 0, так как нет сервера)
        const userGamesPlayed = document.querySelector('#user_games_played');
        userGamesPlayed.textContent = "Сыграно: 0";
        console.log('Установлено количество игр: 0');

        // Устанавливаем статус призов
        const giftsContainer = document.querySelector('.gifts__container');
        const giftsTitle = giftsContainer.querySelector('h3');
        giftsTitle.textContent = 'Нет нераспределённых призов';
        console.log('Установлен статус призов: нет призов');
    } else {
        console.log('Пользователь не авторизован в Telegram WebApp');
    }
});

// Функция для показа уведомлений
function showNotification(message) {
    tg.showAlert(message);
}

// Обработчик для кнопки игры
document.addEventListener('DOMContentLoaded', function() {
    const playButtons = document.querySelectorAll('.play-button');
    
    playButtons.forEach(button => {
        button.addEventListener('click', async () => {
            try {
                console.log('Отправка запроса на создание платежной ссылки...');
                
                const response = await fetch('http://185.84.162.89:8000/create_link', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Origin': window.location.origin
                    }
                });
                
                console.log('Получен ответ от сервера:', response.status, response.statusText);
                const data = await response.json();
                console.log('Получены данные от сервера:', data);
                
                if (!data.error && data.link) {
                    console.log('Открытие платежной ссылки:', data.link);
                    tg.openInvoice(data.link);
                } else {
                    console.error('Ошибка при создании платежной ссылки:', data.error);
                    showNotification('Произошла ошибка при создании платежной ссылки');
                }
            } catch (error) {
                console.error('Ошибка при запросе платежной ссылки:', error);
                showNotification('Произошла ошибка при создании платежной ссылки');
            }
        });
    });
});


