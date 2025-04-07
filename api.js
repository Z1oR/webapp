let tg = window.Telegram.WebApp;
tg.expand();

// Получаем данные пользователя из WebApp
const initData = tg.initDataUnsafe;
const user = initData.user;

// Устанавливаем данные пользователя в профиле
document.addEventListener('DOMContentLoaded', function() {
    const userPhoto = document.querySelector('#user_photo');
    const userName = document.querySelector('#user_name');
    const userGamesPlayed = document.querySelector('#user_games_played');

    // Устанавливаем фото профиля
    if (user && user.photo_url) {
        userPhoto.src = user.photo_url;
    } else {
        userPhoto.src = "./img/profile.svg";
    }

    // Устанавливаем имя пользователя
    if (user) {
        let fullName = user.first_name || '';
        if (user.last_name) {
            fullName += ' ' + user.last_name;
        }
        userName.textContent = fullName || "Пользователь";
    }

    // Получаем данные пользователя с сервера
    if (user) {
        getUserData();
    }
});

function getUserData() {
    fetch('http://185.84.162.89:8000/user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            photo_url: user.photo_url
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Данные пользователя получены:', data);
        
        // Обновляем количество сыгранных игр
        document.querySelector('#user_games_played').textContent = `Сыграно: ${data.games_played || 0}`;

        // Обработка призов
        const giftsContainer = document.querySelector('.gifts__container');
        const giftsTitle = giftsContainer.querySelector('h3');

        if (data.prizes && data.prizes.length > 0) {
            giftsTitle.textContent = `У вас ${data.prizes.length} нераспределённых призов`;
            
            // Создаем список призов
            const prizesList = document.createElement('ul');
            prizesList.className = 'prizes-list';
            
            data.prizes.forEach(prize => {
                const prizeItem = document.createElement('li');
                prizeItem.textContent = prize;
                prizesList.appendChild(prizeItem);
            });
            
            // Удаляем старый список призов если есть
            const oldPrizesList = giftsContainer.querySelector('.prizes-list');
            if (oldPrizesList) {
                oldPrizesList.remove();
            }
            
            giftsContainer.appendChild(prizesList);
        } else {
            giftsTitle.textContent = 'Нет нераспределённых призов';
        }
    })
    .catch(error => {
        console.error('Ошибка при получении данных пользователя:', error);
    });
}

// Обработчик для кнопки игры
document.addEventListener('DOMContentLoaded', function() {
    const playButtons = document.querySelectorAll('.play-button');
    
    playButtons.forEach(button => {
        button.addEventListener('click', () => {
            fetch('http://185.84.162.89:8000/create_link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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
