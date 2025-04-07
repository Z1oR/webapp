let tg = window.Telegram.WebApp;
tg.expand();

let user = tg.initData.user;
let user_id = user.id;
let user_username = user.username;
let user_first_name = user.first_name;
let user_last_name = user.last_name;
let user_photo = user.photo_url;

document.querySelector('#user_photo').src = user_photo || "./img/profile.svg";
document.querySelector('#user_name').textContent = user_first_name + ' ' + user_last_name || "Пользователь";


function getUserData() {
    fetch('https://api.example.com/user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: user_id
        })
    })
    .then(response => response.json())
    .then(data => {
        // Обработка полученных данных
        console.log('Данные пользователя получены:', data);
        
        // Обновляем количество сыгранных игр
        document.querySelector('#user_games_played').textContent = `Сыграно: ${data.games_played}`;

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

// getUserData();



const playBtn = document.querySelector('.play-button');

playBtn.addEventListener('click', () => {
    fetch('http://185.84.162.89:8000/create_link')
        .then(response => response.json())
        .then(data => {
            if (!data.error && data.link) {
                // Открываем платежную ссылку
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
