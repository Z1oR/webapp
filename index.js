let startBtn = document.querySelector(".StartScreen_image")
let start_screen = document.querySelector(".newStartScreen__")
let game__Dino = document.querySelector(".game__Dino")

let screen = 0;
let currentUser = null;
let isAuthenticated = false;

let tg = window.Telegram.WebApp;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Инициализация Telegram Mini App
    tg.ready();
    tg.expand();

    // Получаем данные пользователя из Telegram
    const user = {
        id: tg.initDataUnsafe.user.id,
        username: tg.initDataUnsafe.user.username,
        first_name: tg.initDataUnsafe.user.first_name,
        photo_url: tg.initDataUnsafe.user.photo_url
    };

    // Инициализируем пользователя на сервере
    try {
        const response = await fetch('http://185.84.162.89:5000/init_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });

        if (response.ok) {
            currentUser = user;
            updateUI(user);
            loadLeaderboard();
        }
    } catch (error) {
        console.error('Error initializing user:', error);
    }
});

startBtn.addEventListener("click", () => {
    screen++;
    changeScreen()
})

game__Dino.addEventListener("click", () => {
    if (!isAuthenticated) {
        warning('Необходима авторизация', 'Пожалуйста, войдите в аккаунт', 3000);
        screen = 1; // Переходим на экран авторизации
        changeScreen();
        return;
    }
    screen = 3; // Переходим на экран игры
    changeScreen()  
})

function changeScreen() {
    // Скрываем все экраны
    start_screen.style.display = "none";
    document.querySelector(".NextScreen").style.display = "none";
    document.querySelector(".accountScreen").style.display = "none";
    document.querySelector(".DinoGame__game").style.display = "none";
    document.querySelector(".Developer__main").style.display = "none";
    
    if (screen == 0) {
        start_screen.style.display = "flex";
        document.querySelector(".Developer__main").style.display = "flex";
    }
    else if (screen == 1) {
        document.querySelector(".NextScreen").style.display = "flex";
    }
    else if (screen == 2) {
        if (!isAuthenticated) {
            warning('Необходима авторизация', 'Пожалуйста, войдите в аккаунт', 3000);
            screen = 1;
            changeScreen();
            return;
        }
        document.querySelector(".accountScreen").style.display = "flex";
    }
    else if (screen == 3) {
        if (!isAuthenticated) {
            warning('Необходима авторизация', 'Пожалуйста, войдите в аккаунт', 3000);
            screen = 1;
            changeScreen();
            return;
        }
        document.querySelector(".DinoGame__game").style.display = "flex";
        if (typeof window.initGame === 'function') {
            window.initGame();
        }
    }
}

function warning(title, text, time){
    const warningScreen = document.querySelector(".WarningScreen");
    warningScreen.style.display = "flex";
    document.querySelector(".headerWarning").textContent = title;
    document.querySelector(".mainWarning").textContent = text;

    // Устанавливаем длительность анимации полосы
    warningScreen.style.setProperty('--warning-duration', `${time}ms`);

    // Добавляем стиль для анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes warning-timer {
            from { width: 100%; }
            to { width: 0%; }
        }
        .WarningScreen::after {
            animation: warning-timer var(--warning-duration) linear forwards;
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
        warningScreen.style.display = "none";
        style.remove();
    }, time);
}

let nextScreen = document.querySelector(".NextScreen")
let authBtn = document.querySelector(".auth button")
let regBtn = document.querySelector(".reg button") 
let groupInput = document.querySelector(".group")
let screenTitle = document.querySelector(".Screen__header__title")
let authButton = document.querySelector(".Screen__footer__button_auth")
let regButton = document.querySelector(".Screen__footer__button_reg")

let isRegistration = false

authBtn.addEventListener("click", () => {
    isRegistration = false
    groupInput.style.display = "none"
    regButton.style.display = "none"
    authButton.style.display = "block"
    screenTitle.textContent = "войти в аккаунт"
})

regBtn.addEventListener("click", () => {
    isRegistration = true
    groupInput.style.display = "block" 
    regButton.style.display = "block"
    authButton.style.display = "none"
    screenTitle.textContent = "регистрация"
})

// Обновление UI
function updateUI(user) {
    // Обновляем информацию о пользователе
    const userAvatar = document.querySelector('.user-avatar');
    const userName = document.querySelector('.user-name');

    if (user.photo_url) {
        userAvatar.src = user.photo_url;
    } else {
        userAvatar.src = 'https://telegram.org/img/t_logo.png';
    }
    userName.textContent = user.first_name || user.username || 'Гость';
}

// Загрузка таблицы лидеров
async function loadLeaderboard() {
    try {
        const response = await fetch('http://185.84.162.89:5000/leaderboard');
        if (response.ok) {
            const data = await response.json();
            updateLeaderboard(data.leaderboard);
            
            // Обновляем лучший счет пользователя
            const userScore = data.leaderboard.find(item => item.user_id === currentUser.id);
            if (userScore) {
                document.querySelector('.best-score-value').textContent = userScore.score;
            }
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// Обновление таблицы лидеров
function updateLeaderboard(leaderboardData) {
    const leaderboardList = document.querySelector('.leaderboard-list');
    leaderboardList.innerHTML = '';

    leaderboardData.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        
        const avatar = document.createElement('img');
        avatar.className = 'leaderboard-avatar';
        avatar.src = entry.photo_url || 'https://telegram.org/img/t_logo.png';
        
        const info = document.createElement('div');
        info.className = 'leaderboard-info';
        
        const name = document.createElement('div');
        name.className = 'leaderboard-name';
        name.textContent = entry.first_name || entry.username || 'Гость';
        
        const score = document.createElement('div');
        score.className = 'leaderboard-score';
        score.textContent = `Счёт: ${entry.score}`;
        
        info.appendChild(name);
        info.appendChild(score);
        
        item.appendChild(avatar);
        item.appendChild(info);
        
        leaderboardList.appendChild(item);
    });
}

// Обработчики кнопок
document.getElementById('leaderboard-btn').addEventListener('click', () => {
    document.querySelector('.main-screen').classList.add('hidden');
    document.querySelector('.leaderboard-screen').classList.remove('hidden');
    loadLeaderboard();
});

document.getElementById('back-btn').addEventListener('click', () => {
    document.querySelector('.leaderboard-screen').classList.add('hidden');
    document.querySelector('.main-screen').classList.remove('hidden');
});

// Сохранение игровой статистики
async function saveGameStats(score) {
    if (!currentUser) return;
    
    try {
        const response = await fetch('http://185.84.162.89:5000/save_game_stats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                score: score
            })
        });

        if (response.ok) {
            loadLeaderboard();
        }
    } catch (error) {
        console.error('Error saving game stats:', error);
    }
}

// Экспортируем функции для использования в game.js
window.saveGameStats = saveGameStats;

