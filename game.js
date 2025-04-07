const dino = document.getElementById('dino');
const cactus = document.getElementById('cactus');
const scoreElement = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over');
const restartBtn = document.getElementById('restart-btn');
const finalScoreElement = document.getElementById('final-score');

let isJumping = false;
let isGameOver = false;
let score = 0;
let level = 1;
let gameSpeed = 1.5;
let animationId;
let gameInitialized = false;

// Проверка авторизации перед запуском игры
function checkGameAccess() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    
    if (!token || !userId) {
        // Если нет токена или ID, перенаправляем на экран авторизации
        document.querySelector('.DinoGame__game').style.display = 'none';
        document.querySelector('.accountScreen').style.display = 'none';
        document.querySelector('.NextScreen').style.display = 'flex';
        warning('Необходима авторизация', 'Пожалуйста, войдите в аккаунт', 3000);
        return false;
    }
    
    return true;
}

// Функция прыжка
function jump() {
    if (!isJumping && !isGameOver) {
        isJumping = true;
        dino.style.animation = 'jump 0.5s';
        
        setTimeout(() => {
            dino.style.animation = '';
            isJumping = false;
        }, 500);
    }
}

// Обработка столкновений и движения кактуса
function gameLoop() {
    if (isGameOver) return;

    const dinoRect = dino.getBoundingClientRect();
    const cactusRect = cactus.getBoundingClientRect();

    // Проверка столкновения
    if (
        dinoRect.right > cactusRect.left &&
        dinoRect.left < cactusRect.right &&
        dinoRect.bottom > cactusRect.top
    ) {
        gameOver();
        return;
    }

    // Увеличение скорости игры
    if (score > 0 && score % 100 === 0) {
        gameSpeed += 0.1;
        cactus.style.animation = `cactusMove ${1.5/gameSpeed}s infinite linear`;
    }

    // Обновление счета
    score++;
    scoreElement.textContent = score;

    animationId = requestAnimationFrame(gameLoop);
}

// Функция окончания игры
async function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationId);
    gameOverScreen.classList.remove('hidden');
    finalScoreElement.textContent = score;

    // Сохранение результата
    await saveGameStats(score);
}

// Сохранение игровой статистики
async function saveGameStats(score) {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    
    if (!token || !userId) return;

    try {
        const response = await fetch('http://localhost:5000/save_game_stats', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ score, level })
        });

        if (response.ok) {
            // Обновляем таблицу лидеров после сохранения
            const leaderboardResponse = await fetch(`http://localhost:5000/statistics/leaderboard/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (leaderboardResponse.ok) {
                const data = await leaderboardResponse.json();
                updateLeaderboard(data.leaderboard);
            }
        }
    } catch (error) {
        console.error('Error saving game stats:', error);
    }
}

// Функция перезапуска игры
function restartGame() {
    isGameOver = false;
    score = 0;
    level = 1;
    gameSpeed = 1.5;
    cactus.style.animation = 'cactusMove 1.5s infinite linear';
    gameOverScreen.classList.add('hidden');
    scoreElement.textContent = '0';
    gameLoop();
}

// Инициализация игры
function initGame() {
    if (gameInitialized) return;
    
    // Проверяем авторизацию
    if (!checkGameAccess()) return;
    
    // Сбрасываем игру
    isGameOver = false;
    score = 0;
    level = 1;
    gameSpeed = 1.5;
    cactus.style.animation = 'cactusMove 1.5s infinite linear';
    gameOverScreen.classList.add('hidden');
    scoreElement.textContent = '0';
    
    // Запускаем игровой цикл
    gameLoop();
    gameInitialized = true;
}

// Уведомления
function warning(title, text, time) {
    const warningScreen = document.querySelector(".WarningScreen");
    if (!warningScreen) return;
    
    warningScreen.style.display = "flex";
    document.querySelector(".headerWarning").textContent = title;
    document.querySelector(".mainWarning").textContent = text;

    warningScreen.style.setProperty('--warning-duration', `${time}ms`);

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

// Обновление таблицы лидеров
function updateLeaderboard(leaderboardData) {
    const oneThree = document.querySelector('.one-free');
    const rest = document.querySelector('.free-100');
    
    if (!oneThree || !rest) return;
    
    oneThree.innerHTML = '';
    rest.innerHTML = '';
    
    // Первые три места
    leaderboardData.slice(0, 3).forEach((entry, index) => {
        const p = document.createElement('p');
        p.textContent = `${index + 1} место - ${entry.username} (${entry.group}) - ${entry.score}`;
        oneThree.appendChild(p);
    });
    
    // Остальные места
    leaderboardData.slice(3).forEach((entry, index) => {
        const p = document.createElement('p');
        p.textContent = `${index + 4} место - ${entry.username} (${entry.group}) - ${entry.score}`;
        rest.appendChild(p);
    });
}

// Обработчики событий
document.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && !isGameOver) {
        e.preventDefault();
        jump();
    }
});

document.addEventListener('touchstart', (e) => {
    if (!isGameOver) {
        e.preventDefault();
        jump();
    }
});

restartBtn.addEventListener('click', restartGame);

// Проверка авторизации при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Проверяем наличие авторизации
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    
    if (token && userId) {
        try {
            // Получаем данные пользователя и таблицу лидеров
            const response = await fetch(`http://localhost:5000/statistics/leaderboard/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Обновляем профиль
                const profileInfo = document.querySelector('.profileInfo');
                if (profileInfo) {
                    profileInfo.querySelector('p:nth-child(1)').textContent = `логин: ${data.username}`;
                    profileInfo.querySelector('p:nth-child(2)').textContent = `группа: ${data.group}`;
                }
                
                // Обновляем таблицу лидеров
                updateLeaderboard(data.leaderboard);
                
                // Если мы на экране игры, запускаем ее
                if (document.querySelector('.DinoGame__game').style.display === 'flex') {
                    initGame();
                }
            } else {
                // Токен недействителен, очищаем хранилище
                localStorage.removeItem('token');
                localStorage.removeItem('user_id');
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        }
    }
});

// Экспортируем функции
window.initGame = initGame;
window.checkGameAccess = checkGameAccess; 
