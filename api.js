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
                    method: 'POST',
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
