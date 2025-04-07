// Инициализация Telegram WebApp
let tg = window.Telegram.WebApp;
tg.expand();

// Пользовательские данные
let user = {
    id: null,
    username: "Гость",
    photoUrl: "./img/profile.svg",
    balance: 0,
    isAuthorized: false,
    prizes: []
};

// Хранение токена JWT
let token = null;

// API сервера
const API_URL = "http://185.84.162.89:8000/api";

// Инициализация
document.addEventListener('DOMContentLoaded', async function() {
    // Проверяем инициализацию Telegram WebApp
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        // Получаем данные пользователя из Telegram
        const telegramUser = tg.initDataUnsafe.user;
        user.id = telegramUser.id;
        user.username = telegramUser.username || telegramUser.first_name || "Пользователь";
        user.photoUrl = telegramUser.photo_url || "./img/profile.svg";
        
        // Авторизуемся через Telegram
        await authenticateWithTelegram();
    }
    
    // Обновляем UI для отображения данных пользователя
    updateUserInterface();
    
    // Привязываем обработчики событий к кнопкам
    bindEventHandlers();
});

// Аутентификация с Telegram
async function authenticateWithTelegram() {
    try {
        // Получаем initData из Telegram
        const initData = tg.initData;
        
        // Отправляем запрос на сервер для верификации и получения токена
        const response = await fetch(`${API_URL}/telegram/webapp/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user: tg.initDataUnsafe.user,
                auth_date: tg.initDataUnsafe.auth_date,
                hash: tg.initDataUnsafe.hash
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.data.user_exists) {
                // Пользователь существует, сохраняем токен
                token = data.data.token.access_token;
                user.isAuthorized = true;
                user.id = data.data.token.user_id;
                user.username = data.data.token.username;
                
                // Получаем дополнительные данные пользователя
                await getUserProfile();
            } else {
                // Пользователь не существует, показываем сообщение или регистрируем
                showRegistrationModal();
            }
        } else {
            console.error('Ошибка авторизации:', data.error);
            showNotification('Ошибка авторизации, используйте демо-режим');
        }
    } catch (error) {
        console.error('Ошибка при авторизации через Telegram:', error);
        showNotification('Ошибка подключения к серверу');
    }
}

// Получение профиля пользователя
async function getUserProfile() {
    if (!token) return;
    
    try {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const profileData = await response.json();
        
        if (profileData) {
            user.username = profileData.username;
            
            // Получаем призы пользователя
            await getUserPrizes();
        }
    } catch (error) {
        console.error('Ошибка при получении профиля:', error);
    }
}

// Получение призов пользователя
async function getUserPrizes() {
    if (!token) return;
    
    try {
        const response = await fetch(`${API_URL}/prizes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const prizes = await response.json();
        
        if (Array.isArray(prizes)) {
            user.prizes = prizes;
            updatePrizesDisplay();
        }
    } catch (error) {
        console.error('Ошибка при получении призов:', error);
    }
}

// Запись результата игры
async function recordGameResult(gameType, prizeId = null) {
    if (!token) return;
    
    try {
        // Сначала получаем nonce для безопасного запроса
        const nonceResponse = await fetch(`${API_URL}/security/nonce`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: user.id })
        });
        
        const nonceData = await nonceResponse.json();
        
        // Отправляем результат игры с nonce
        const response = await fetch(`${API_URL}/game/result`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: user.id,
                game_type: gameType,
                prize_id: prizeId,
                nonce: nonceData.nonce,
                timestamp: nonceData.timestamp
            })
        });
        
        const result = await response.json();
        
        if (result.message) {
            console.log('Результат игры записан:', result.message);
        }
    } catch (error) {
        console.error('Ошибка при записи результата игры:', error);
    }
}

// Создание приза
async function createPrize(prizeType, prizeName) {
    if (!token) return null;
    
    try {
        // Сначала получаем nonce для безопасного запроса
        const nonceResponse = await fetch(`${API_URL}/security/nonce`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: user.id })
        });
        
        const nonceData = await nonceResponse.json();
        
        // Создаем приз с nonce
        const response = await fetch(`${API_URL}/prizes`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prize_data: {
                    user_id: user.id,
                    prize_type: prizeType,
                    prize_name: prizeName,
                    status: 'pending'
                },
                secure_req: {
                    nonce: nonceData.nonce,
                    timestamp: nonceData.timestamp
                }
            })
        });
        
        const prize = await response.json();
        
        // Обновляем список призов пользователя
        await getUserPrizes();
        
        return prize;
    } catch (error) {
        console.error('Ошибка при создании приза:', error);
        return null;
    }
}

// Загрузка лидерборда
async function loadLeaderboard() {
    try {
        const response = await fetch(`${API_URL}/leaderboard?limit=10`);
        const leaders = await response.json();
        
        if (Array.isArray(leaders)) {
            updateLeaderboardDisplay(leaders);
        }
    } catch (error) {
        console.error('Ошибка при загрузке лидерборда:', error);
    }
}

// Обновление отображения лидерборда
function updateLeaderboardDisplay(leaders) {
    const leaderContainer = document.querySelector('.Leader__main');
    leaderContainer.innerHTML = '';
    
    leaders.forEach((leader, index) => {
        const leaderItem = document.createElement('div');
        leaderItem.className = 'leader__item leader';
        leaderItem.innerHTML = `
            <img src="./img/leader.svg" alt="">
            <p>${index + 1}</p>
            <p>${leader.username}</p>
            <p>${leader.games_count} игр</p>
        `;
        
        leaderContainer.appendChild(leaderItem);
    });
}

// Обновление отображения призов пользователя
function updatePrizesDisplay() {
    const giftsContainer = document.querySelector('.gifts__container');
    
    if (user.prizes && user.prizes.length > 0) {
        // Есть призы для отображения
        giftsContainer.innerHTML = `
            <h3>Ваши призы:</h3>
            <div class="prizes-list"></div>
        `;
        
        const prizesList = giftsContainer.querySelector('.prizes-list');
        
        user.prizes.forEach(prize => {
            const prizeItem = document.createElement('div');
            prizeItem.className = 'prize-item-profile';
            
            const statusEmoji = prize.status === 'pending' ? '⏳' : '✅';
            
            prizeItem.innerHTML = `
                <p>${statusEmoji} ${prize.prize_name}</p>
                <p>Тип: ${prize.prize_type}</p>
            `;
            
            prizesList.appendChild(prizeItem);
        });
    } else {
        // Нет призов
        giftsContainer.innerHTML = `
            <div class="gifts__icon">
                <img src="./img/folder.svg" alt="Папка">
            </div>
            <h3>Нет нераспределённых призов</h3>
        `;
    }
}

// Обновление пользовательского интерфейса
function updateUserInterface() {
    // Обновляем аватарку и имя в профиле
    const profileAvatar = document.querySelector('.profile__avatar img');
    const profileName = document.querySelector('.profile__info h2');
    
    if (profileAvatar) profileAvatar.src = user.photoUrl;
    if (profileName) profileName.textContent = user.username;
    
    // Загружаем лидерборд
    loadLeaderboard();
    
    // Обновляем отображение призов
    updatePrizesDisplay();
    
    // Проверяем статус демо-режима
    const demoModeCheckbox = document.querySelector('.Demo-mode input[type="checkbox"]');
    if (!user.isAuthorized) {
        // Если пользователь не авторизован, включаем демо-режим
        demoModeCheckbox.checked = true;
    }
}

// Показать модальное окно для регистрации
function showRegistrationModal() {
    const modal = document.createElement('div');
    modal.className = 'registration-modal';
    modal.innerHTML = `
        <div class="registration-content">
            <h2>Регистрация</h2>
            <p>Для полного доступа к игре требуется регистрация</p>
            <div class="registration-form">
                <input type="text" id="username" placeholder="Имя пользователя" />
                <input type="password" id="password" placeholder="Пароль" />
                <button id="register-btn">Зарегистрироваться</button>
                <button id="cancel-register-btn">Отмена</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчики для модального окна регистрации
    modal.querySelector('#register-btn').addEventListener('click', async () => {
        const username = modal.querySelector('#username').value;
        const password = modal.querySelector('#password').value;
        
        if (username && password) {
            try {
                const response = await fetch(`${API_URL}/users/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username,
                        password,
                        telegram_id: user.id
                    })
                });
                
                const data = await response.json();
                
                if (data.user_id) {
                    showNotification('Регистрация успешна! Выполняется вход...');
                    modal.remove();
                    
                    // Выполняем вход с новыми учетными данными
                    await loginUser(username, password);
                } else {
                    showNotification('Ошибка при регистрации. Попробуйте другое имя пользователя.');
                }
            } catch (error) {
                console.error('Ошибка при регистрации:', error);
                showNotification('Ошибка соединения с сервером');
            }
        } else {
            showNotification('Заполните все поля формы');
        }
    });
    
    modal.querySelector('#cancel-register-btn').addEventListener('click', () => {
        modal.remove();
    });
}

// Вход пользователя с логином и паролем
async function loginUser(username, password) {
    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await fetch(`${API_URL}/token`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.access_token) {
            token = data.access_token;
            user.isAuthorized = true;
            user.id = data.user_id;
            user.username = data.username;
            
            // Обновляем данные пользователя
            await getUserProfile();
            
            // Обновляем интерфейс
            updateUserInterface();
            
            showNotification('Вход выполнен успешно!');
        } else {
            showNotification('Ошибка входа: Неверные учетные данные');
        }
    } catch (error) {
        console.error('Ошибка при входе:', error);
        showNotification('Ошибка соединения с сервером');
    }
}

// Показать уведомление
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 2500);
}

// Привязка обработчиков событий
function bindEventHandlers() {
    // Обработчик для кнопок запуска рулетки
    document.querySelectorAll('.play-button').forEach(button => {
        button.addEventListener('click', async function(event) {
            const gameType = this.dataset.gameType;
            const demoMode = document.querySelector('.Demo-mode input[type="checkbox"]').checked;
            
            if (!demoMode && !user.isAuthorized) {
                // Если не демо и пользователь не авторизован
                showNotification('Для игры с реальными призами необходима авторизация');
                return;
            }
            
            if (!demoMode) {
                // Если не демо, проверяем возможность оплаты
                const costMap = {
                    'stars50': 50,
                    'stars100': 100,
                    'coder5dollar': 200,
                    'coder20dollar': 500
                };
                
                const cost = costMap[gameType] || 50;
                
                // Показываем модальное окно с подтверждением оплаты
                if (await showPaymentConfirmation(cost, gameType)) {
                    // Если оплата одобрена, запускаем рулетку
                    spinRouletteAndRecordResult(event, gameType);
                }
            } else {
                // В демо-режиме запускаем рулетку без оплаты
                spinRouletteAndRecordResult(event, gameType, true);
            }
        });
    });
    
    // Обработчики для кнопок модального окна с призом
    const modal = document.querySelector('.prize-modal');
    
    if (modal) {
        // Кнопка продажи приза
        const sellPrizeBtn = modal.querySelector('.sell-prize-btn');
        if (sellPrizeBtn) {
            sellPrizeBtn.addEventListener('click', function() {
                if (user.isAuthorized && currentPrizeId) {
                    // Логика продажи приза
                    sellPrize(currentPrizeId);
                }
                modal.style.display = 'none';
            });
        }
        
        // Кнопка сохранения услуги
        const saveServiceBtn = modal.querySelector('.save-service-btn');
        if (saveServiceBtn) {
            saveServiceBtn.addEventListener('click', function() {
                if (user.isAuthorized && currentPrizeId) {
                    // Логика сохранения услуги
                    saveService(currentPrizeId);
                }
                modal.style.display = 'none';
            });
        }
    }
}

// Глобальная переменная для хранения ID текущего приза
let currentPrizeId = null;

// Запуск рулетки и запись результата
async function spinRouletteAndRecordResult(event, gameType, isDemo = false) {
    const originalEvent = event.type === 'click' ? event : { target: event };
    const button = originalEvent.target;
    const gameContainer = button.closest(`.${gameType}Game`);
    
    if (!gameContainer) return;
    
    const rouletteStrip = gameContainer.querySelector('.roulette-strip');
    
    // Отключаем кнопку на время вращения
    button.disabled = true;
    
    // Генерируем случайный сдвиг
    const spinDuration = 3000 + Math.random() * 1000; // 3-4 секунды
    const spinDistance = 1000 + Math.random() * 2000; // Случайная дистанция
    
    // Сбрасываем прошлое положение ленты
    rouletteStrip.style.transition = 'none';
    rouletteStrip.style.transform = 'translateX(0)';
    
    // Запускаем анимацию вращения
    setTimeout(() => {
        rouletteStrip.style.transition = `transform ${spinDuration/1000}s cubic-bezier(0.1, 0.7, 0.1, 1)`;
        rouletteStrip.style.transform = `translateX(-${spinDistance}px)`;
    }, 10);
    
    // После окончания анимации
    setTimeout(async () => {
        // Определяем выигрыш
        const prizeItems = gameContainer.querySelectorAll('.prize-item');
        const pointerPosition = gameContainer.querySelector('.pointer').getBoundingClientRect();
        let winningPrize = "Подарок"; // По умолчанию
        
        prizeItems.forEach(item => {
            const itemPosition = item.getBoundingClientRect();
            if (itemPosition.left <= pointerPosition.left && itemPosition.right >= pointerPosition.left) {
                winningPrize = item.textContent;
            }
        });
        
        // Обновляем текст приза в модальном окне
        const prizeNameElement = document.querySelector('.prize-modal .prize-name');
        prizeNameElement.textContent = winningPrize;
        
        if (!isDemo && user.isAuthorized) {
            // Если это реальная игра, создаем приз и записываем результат
            try {
                // Создаем приз в системе
                const prizeType = gameType === 'stars50' || gameType === 'stars100' ? 'stars' : 'service';
                const newPrize = await createPrize(prizeType, winningPrize);
                
                if (newPrize && newPrize.id) {
                    currentPrizeId = newPrize.id;
                    
                    // Записываем результат игры
                    await recordGameResult(gameType, newPrize.id);
                }
            } catch (error) {
                console.error('Ошибка при обработке выигрыша:', error);
            }
        }
        
        // Проверяем демо-режим и тип игры для определения нужных кнопок
        const modal = document.querySelector('.prize-modal');
        const demoModeBtn = modal.querySelector('.demo-mode-btn');
        const sellPrizeBtn = modal.querySelector('.sell-prize-btn');
        const takePrizeBtn = modal.querySelector('.take-prize-btn');
        const getServiceBtn = modal.querySelector('.get-service-btn');
        const saveServiceBtn = modal.querySelector('.save-service-btn');
        const closeModalBtn = modal.querySelector('.close-modal-btn');
        
        // Скрываем все кнопки сначала
        demoModeBtn.style.display = 'none';
        sellPrizeBtn.style.display = 'none';
        takePrizeBtn.style.display = 'none';
        getServiceBtn.style.display = 'none';
        saveServiceBtn.style.display = 'none';
        closeModalBtn.style.display = 'none';
        
        // Показываем соответствующие кнопки
        if (isDemo) {
            demoModeBtn.style.display = 'block';
            closeModalBtn.style.display = 'block';
        } else if (user.isAuthorized) {
            const isStarsGame = gameType === 'stars50' || gameType === 'stars100';
            const isDollarGame = gameType === 'coder5dollar' || gameType === 'coder20dollar';
            
            if (isStarsGame) {
                sellPrizeBtn.style.display = 'block';
                takePrizeBtn.style.display = 'block';
            } else if (isDollarGame) {
                getServiceBtn.style.display = 'block';
                saveServiceBtn.style.display = 'block';
            }
            closeModalBtn.style.display = 'block';
        } else {
            closeModalBtn.style.display = 'block';
        }
        
        // Показываем модальное окно
        modal.style.display = 'flex';
        
        // Включаем кнопку обратно
        button.disabled = false;
        
        // Обновляем отображение профиля пользователя
        if (!isDemo) {
            updateUserInterface();
        }
    }, spinDuration + 100);
}

// Показать подтверждение оплаты
function showPaymentConfirmation(cost, gameType) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'payment-modal';
        modal.innerHTML = `
            <div class="payment-content">
                <h2>Подтверждение оплаты</h2>
                <p>С вашего счета будет списано <b>${cost} звезд</b> для игры в "${gameType}".</p>
                <div class="payment-buttons">
                    <button id="confirm-payment">Подтвердить</button>
                    <button id="cancel-payment">Отмена</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('#confirm-payment').addEventListener('click', () => {
            modal.remove();
            resolve(true);
        });
        
        modal.querySelector('#cancel-payment').addEventListener('click', () => {
            modal.remove();
            resolve(false);
        });
    });
}

// Продажа приза
async function sellPrize(prizeId) {
    showNotification('Приз успешно продан!');
    await getUserPrizes(); // Обновляем список призов
}

// Сохранение услуги
async function saveService(prizeId) {
    showNotification('Услуга сохранена в профиле!');
    await getUserPrizes(); // Обновляем список призов
} 