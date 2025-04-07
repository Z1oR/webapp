let tg = window.Telegram.WebApp;
tg.expand();

// Получаем данные пользователя из WebApp
const initData = tg.initDataUnsafe;
const user = initData.user;

// Устанавливаем данные пользователя в профиле
document.addEventListener('DOMContentLoaded', function() {
    if (user) {
        // Устанавливаем фото профиля
        const userPhoto = document.querySelector('#user_photo');
        if (user.photo_url) {
            userPhoto.src = user.photo_url;
        } else {
            userPhoto.src = "./img/profile.svg";
        }

        // Устанавливаем имя пользователя
        const userName = document.querySelector('#user_name');
        let fullName = user.first_name || '';
        if (user.last_name) {
            fullName += ' ' + user.last_name;
        }
        userName.textContent = fullName || "Пользователь";

        // Устанавливаем количество игр (пока что 0, так как нет сервера)
        const userGamesPlayed = document.querySelector('#user_games_played');
        userGamesPlayed.textContent = "Сыграно: 0";

        // Устанавливаем статус призов
        const giftsContainer = document.querySelector('.gifts__container');
        const giftsTitle = giftsContainer.querySelector('h3');
        giftsTitle.textContent = 'Нет нераспределённых призов';
    }
});

// Обработчик для кнопки игры
document.addEventListener('DOMContentLoaded', function() {
    const playButtons = document.querySelectorAll('.play-button');
    
    playButtons.forEach(button => {
        button.addEventListener('click', () => {
            fetch('https://185.84.162.89:8000/create_link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': window.location.origin
                }
            })
            .then(response => response.json())
            .then(data => {
                if (!data.error && data.link) {
                    window.open(data.link, '_blank');
                } else {
                    console.error('Ошибка при создании платежной ссылки');
                    showNotification('Произошла ошибка при создании платежной ссылки');
                }
            })
            .catch(error => {
                console.error('Ошибка при запросе платежной ссылки:', error);
                showNotification('Произошла ошибка при создании платежной ссылки');
            });
        });
    });
});
