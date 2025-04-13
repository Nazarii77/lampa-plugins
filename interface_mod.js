(function () {
    'use strict';

    // Основной объект плагина
    var InterFaceMod = {
        // Название плагина
        name: 'interface_mod',
        // Версия плагина
        version: '2.1.0',
        // Настройки по умолчанию
        settings: {
            enabled: true,
            show_buttons: true,
            show_movie_type: true,
            theme: 'default',
            colored_ratings: true
        }
    };

    // Функция для добавления информации о сезонах и сериях на постер
    function addSeasonInfo() {
        // Слушатель события загрузки полной информации о фильме/сериале
        Lampa.Listener.follow('full', function (data) {
            if (data.type === 'complite' && data.data.movie.number_of_seasons) {
                // Получаем данные о сериале
                var movie = data.data.movie;
                var status = movie.status;
                var seasons = movie.number_of_seasons;
                var episodes = movie.number_of_episodes;
                
                // Функция для правильного склонения слов
                function plural(number, one, two, five) {
                    let n = Math.abs(number);
                    n %= 100;
                    if (n >= 5 && n <= 20) {
                        return five;
                    }
                    n %= 10;
                    if (n === 1) {
                        return one;
                    }
                    if (n >= 2 && n <= 4) {
                        return two;
                    }
                    return five;
                }
                
                // Создаем текст для отображения на постере с правильным склонением
                var seasonsText = plural(seasons, 'Сезон', 'Сезона', 'Сезонов');
                var episodesText = plural(episodes, 'Серия', 'Серии', 'Серий');
                
                // Формируем текст в две строки
                var seasonsLine = seasons + ' ' + seasonsText;
                var episodesLine = episodes + ' ' + episodesText;
                
                // Определяем фоновый цвет на основе статуса сериала
                var bgColor = status === 'Ended' || status === 'Canceled' ? '#2196F3' : '#F44336';
                
                // Создаем элемент с информацией о сезонах и сериях
                var infoElement = $('<div class="season-info-label"></div>');
                
                // Создаем внутренние элементы для двух строк
                var seasonsElement = $('<div></div>').text(seasonsLine);
                var episodesElement = $('<div></div>').text(episodesLine);
                
                // Добавляем строки в основной элемент
                infoElement.append(seasonsElement).append(episodesElement);
                
                infoElement.css({
                    'position': 'absolute',
                    'top': '1.4em',
                    'right': '-0.8em',
                    'background-color': bgColor,
                    'color': 'white',
                    'padding': '0.4em 0.4em',
                    'border-radius': '0.3em',
                    'font-size': '0.8em',
                    'z-index': '999',
                    'text-align': 'center',
                    'line-height': '1.2'
                });
                
                // Добавляем элемент на постер
                setTimeout(function() {
                    var poster = data.object.activity.render().find('.full-start-new__poster');
                    if (poster.length) {
                        poster.css('position', 'relative');
                        poster.append(infoElement);
                    }
                }, 100);
            }
        });
    }

    // Функция для отображения всех кнопок в карточке
    function showAllButtons() {
        // Слушатель события загрузки полной информации о фильме/сериале
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') {
                setTimeout(function () {
                    var fullContainer = e.object.activity.render();
                    var targetContainer = fullContainer.find('.full-start-new__buttons');
                    fullContainer.find('.button--play').remove();
                    
                    // Создадим отдельные селекторы для разных контейнеров
                    var buttonsContainer = fullContainer.find('.buttons--container .full-start__button');
                    var existingButtons = targetContainer.find('.full-start__button');
                    
                    // Определяем категории кнопок по классам
                    var categories = {
                        online: [],
                        torrent: [],
                        trailer: [],
                        other: []
                    };
                    
                    // Массив для хранения текстов кнопок чтобы избежать дублирования
                    var addedButtonTexts = {};
                    
                    // Функция для добавления кнопки в категорию с проверкой на дубликаты
                    function addButtonToCategory(button, category) {
                        var $button = $(button);
                        var buttonText = $button.text().trim();
                        
                        // Если у кнопки нет текста или такой текст уже есть, пропускаем
                        if (!buttonText || addedButtonTexts[buttonText]) {
                            return;
                        }
                        
                        addedButtonTexts[buttonText] = true;
                        categories[category].push($button);
                    }
                    
                    // Обрабатываем кнопки из контейнера buttons--container
                    buttonsContainer.each(function() {
                        var $button = $(this);
                        var className = $button.attr('class');
                        
                        if (className.includes('online')) {
                            addButtonToCategory(this, 'online');
                        } else if (className.includes('torrent')) {
                            addButtonToCategory(this, 'torrent');
                        } else if (className.includes('trailer')) {
                            addButtonToCategory(this, 'trailer');
                        } else {
                            addButtonToCategory(this, 'other');
                        }
                    });
                    
                    // Обрабатываем кнопки, которые уже есть в целевом контейнере
                    existingButtons.each(function() {
                        var $button = $(this);
                        var className = $button.attr('class');
                        
                        if (className.includes('online')) {
                            addButtonToCategory(this, 'online');
                        } else if (className.includes('torrent')) {
                            addButtonToCategory(this, 'torrent');
                        } else if (className.includes('trailer')) {
                            addButtonToCategory(this, 'trailer');
                        } else {
                            addButtonToCategory(this, 'other');
                        }
                    });
                    
                    // Порядок кнопок
                    var buttonSortOrder = ['online', 'torrent', 'trailer', 'other'];

                    // Очищаем и заполняем контейнер
                    targetContainer.empty();
                    buttonSortOrder.forEach(function (category) {
                        categories[category].forEach(function ($button) {
                            targetContainer.append($button);
                        });
                    });

                    // Добавляем стиль для переноса кнопок
                    targetContainer.css({
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '10px'
                    });

                    // Включаем контроллер
                    Lampa.Controller.toggle("full_start");
                }, 100);
            }
        });
    }

    // Функция для изменения лейблов TV и добавления лейбла ФИЛЬМ
    function changeMovieTypeLabels() {
        // Добавляем CSS стили для изменения лейблов
        var styleTag = document.createElement('style');
        styleTag.innerHTML = `
            /* Базовый стиль для всех лейблов */
            .content-label {
                position: absolute !important;
                top: 1.4em !important;
                left: -0.8em !important;
                color: white !important;
                padding: 0.4em 0.4em !important;
                border-radius: 0.3em !important;
                font-size: 0.8em !important;
                z-index: 10 !important;
            }
            
            /* Сериал - синий */
            .serial-label {
                background-color: #3498db !important;
            }
            
            /* Фильм - зелёный */
            .movie-label {
                background-color: #2ecc71 !important;
            }
            
            /* Скрываем встроенный лейбл TV */
            .card--tv .card__type {
                display: none !important;
            }
        `;
        document.head.appendChild(styleTag);
        
        // Функция для добавления лейбла к карточке
        function addLabelToCard(card) {
            if (!InterFaceMod.settings.show_movie_type) return;
            
            // Если уже есть наш лейбл, пропускаем
            if (card.querySelector('.content-label')) return;
            
            var view = card.querySelector('.card__view');
            if (!view) return;
            
            var is_tv = card.classList.contains('card--tv');
            var label = document.createElement('div');
            label.classList.add('content-label');
            
            // Определяем тип контента (только фильм или сериал)
            if (is_tv) {
                // Для сериалов
                label.classList.add('serial-label');
                label.textContent = 'Сериал';
                label.dataset.type = 'serial';
            } else {
                // Для фильмов
                label.classList.add('movie-label');
                label.textContent = 'Фильм';
                label.dataset.type = 'movie';
            }
            
            // Добавляем лейбл
            view.appendChild(label);
        }
        
        // Обработка всех карточек
        function processAllCards() {
            if (!InterFaceMod.settings.show_movie_type) return;
            
            // Находим все карточки на странице
            var cards = document.querySelectorAll('.card');
            cards.forEach(function(card) {
                addLabelToCard(card);
            });
        }
        
        // Используем MutationObserver для отслеживания новых карточек
        var observer = new MutationObserver(function(mutations) {
            var needCheck = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length) {
                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        var node = mutation.addedNodes[i];
                        if (node.classList && (node.classList.contains('card') || node.querySelector('.card'))) {
                            needCheck = true;
                            break;
                        }
                    }
                }
            });
            
            if (needCheck) {
                setTimeout(processAllCards, 100);
            }
        });
        
        // Запускаем наблюдатель
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Запускаем первичную проверку
        processAllCards();
        
        // Периодическая проверка для карточек, которые могли быть пропущены
        setInterval(processAllCards, 2000);
        
        // Следим за изменением настройки
        Lampa.Settings.listener.follow('change', function(e) {
            if (e.name === 'season_info_show_movie_type') {
                if (e.value) {
                    // Если включено, добавляем стили и лейблы
                    if (!document.querySelector('style[data-id="movie-type-styles"]')) {
                        styleTag.dataset.id = 'movie-type-styles';
                        document.head.appendChild(styleTag);
                    }
                    processAllCards();
                } else {
                    // Если отключено, удаляем стили и лейблы
                    var style = document.querySelector('style[data-id="movie-type-styles"]');
                    if (style) style.remove();
                    
                    document.querySelectorAll('.content-label').forEach(function(label) {
                        label.remove();
                    });
                }
            }
        });
    }

    // Функция для применения тем
    function applyTheme(theme) {
        // Удаляем предыдущие стили темы
        const oldStyle = document.querySelector('#interface_mod_theme');
        if (oldStyle) oldStyle.remove();

        // Если выбрано "Нет", просто удаляем стили
        if (theme === 'default') return;

        // Создаем новый стиль
        const style = document.createElement('style');
        style.id = 'interface_mod_theme';

        // Определяем стили для разных тем
        const themes = {
            neon: `
                body {
                    background: linear-gradient(135deg, #0d0221 0%, #150734 50%, #1f0c47 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #ff00ff, #00ffff);
                    color: #fff;
                    box-shadow: 0 0 20px rgba(255, 0, 255, 0.4);
                    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                    border: none;
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 2px solid #ff00ff;
                    box-shadow: 0 0 20px #00ffff;
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #ff00ff, #00ffff);
                    box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
                }
                .full-start__background {
                    opacity: 0.7;
                    filter: brightness(1.2) saturate(1.3);
                }
                .settings__content,
                .settings-input__content,
                .selectbox__content,
                .modal__content {
                    background: rgba(15, 2, 33, 0.95);
                    border: 1px solid rgba(255, 0, 255, 0.1);
                }
            `,
            sunset: `
                body {
                    background: linear-gradient(135deg, #2d1f3d 0%, #614385 50%, #516395 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #ff6e7f, #bfe9ff);
                    color: #2d1f3d;
                    box-shadow: 0 0 15px rgba(255, 110, 127, 0.3);
                    font-weight: bold;
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 2px solid #ff6e7f;
                    box-shadow: 0 0 15px rgba(255, 110, 127, 0.5);
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #ff6e7f, #bfe9ff);
                    color: #2d1f3d;
                }
                .full-start__background {
                    opacity: 0.8;
                    filter: saturate(1.2) contrast(1.1);
                }
            `,
            emerald: `
                body {
                    background: linear-gradient(135deg, #1a2a3a 0%, #2C5364 50%, #203A43 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #43cea2, #185a9d);
                    color: #fff;
                    box-shadow: 0 4px 15px rgba(67, 206, 162, 0.3);
                    border-radius: 5px;
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 3px solid #43cea2;
                    box-shadow: 0 0 20px rgba(67, 206, 162, 0.4);
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #43cea2, #185a9d);
                }
                .full-start__background {
                    opacity: 0.85;
                    filter: brightness(1.1) saturate(1.2);
                }
                .settings__content,
                .settings-input__content,
                .selectbox__content,
                .modal__content {
                    background: rgba(26, 42, 58, 0.98);
                    border: 1px solid rgba(67, 206, 162, 0.1);
                }
            `,
            aurora: `
                body {
                    background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #aa4b6b, #6b6b83, #3b8d99);
                    color: #fff;
                    box-shadow: 0 0 20px rgba(170, 75, 107, 0.3);
                    transform: scale(1.02);
                    transition: all 0.3s ease;
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 2px solid #aa4b6b;
                    box-shadow: 0 0 25px rgba(170, 75, 107, 0.5);
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #aa4b6b, #3b8d99);
                    transform: scale(1.05);
                }
                .full-start__background {
                    opacity: 0.75;
                    filter: contrast(1.1) brightness(1.1);
                }
            `,
            bywolf_mod: `
                body {
                    background: linear-gradient(135deg, #090227 0%, #170b34 50%, #261447 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #fc00ff, #00dbde);
                    color: #fff;
                    box-shadow: 0 0 30px rgba(252, 0, 255, 0.3);
                    animation: cosmic-pulse 2s infinite;
                }
                @keyframes cosmic-pulse {
                    0% { box-shadow: 0 0 20px rgba(252, 0, 255, 0.3); }
                    50% { box-shadow: 0 0 30px rgba(0, 219, 222, 0.3); }
                    100% { box-shadow: 0 0 20px rgba(252, 0, 255, 0.3); }
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 2px solid #fc00ff;
                    box-shadow: 0 0 30px rgba(0, 219, 222, 0.5);
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #fc00ff, #00dbde);
                    animation: cosmic-pulse 2s infinite;
                }
                .full-start__background {
                    opacity: 0.8;
                    filter: saturate(1.3) contrast(1.1);
                }
                .settings__content,
                .settings-input__content,
                .selectbox__content,
                .modal__content {
                    background: rgba(9, 2, 39, 0.95);
                    border: 1px solid rgba(252, 0, 255, 0.1);
                    box-shadow: 0 0 30px rgba(0, 219, 222, 0.1);
                }
            `
        };

        style.textContent = themes[theme] || '';
        document.head.appendChild(style);
    }

    // Функция для изменения цвета рейтинга фильмов и сериалов
    function updateVoteColors() {
        if (!InterFaceMod.settings.colored_ratings) return;
        
        // Функция для изменения цвета элемента в зависимости от рейтинга
        function applyColorByRating(element) {
            const voteText = element.textContent.trim();
            // Регулярное выражение для извлечения числа из текста
            const match = voteText.match(/(\d+(\.\d+)?)/);
            if (!match) return;
            
            const vote = parseFloat(match[0]);
            
            if (vote >= 0 && vote <= 3) {
                element.style.color = "red";
            } else if (vote > 3 && vote < 6) {
                element.style.color = "orange";
            } else if (vote >= 6 && vote < 8) {
                element.style.color = "cornflowerblue";
            } else if (vote >= 8 && vote <= 10) {
                element.style.color = "lawngreen";
            }
        }
        
        // Обрабатываем рейтинги на главной странице и в списках
        document.querySelectorAll(".card__vote").forEach(voteElement => {
            applyColorByRating(voteElement);
        });
        
        // Обрабатываем рейтинги в детальной карточке фильма/сериала
        document.querySelectorAll(".full-start__rate, .full-start-new__rate").forEach(rateElement => {
            applyColorByRating(rateElement);
        });
        
        // Также обрабатываем другие возможные элементы с рейтингом
        document.querySelectorAll(".info__rate, .card__imdb-rate, .card__kinopoisk-rate").forEach(rateElement => {
            applyColorByRating(rateElement);
        });
    }

    // Наблюдатель за изменениями в DOM для обновления цветов рейтинга
    function setupVoteColorsObserver() {
        if (!InterFaceMod.settings.colored_ratings) return;
        
        // Запускаем первичное обновление
        setTimeout(updateVoteColors, 500);
        
        // Создаем наблюдатель для отслеживания изменений в DOM
        const observer = new MutationObserver(function(mutations) {
            setTimeout(updateVoteColors, 100);
        });
        
        // Запускаем наблюдатель
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
    }

    // Добавляем слушатель для обновления цветов в детальной карточке
    function setupVoteColorsForDetailPage() {
        if (!InterFaceMod.settings.colored_ratings) return;
        
        // Слушатель события загрузки полной информации о фильме/сериале
        Lampa.Listener.follow('full', function (data) {
            if (data.type === 'complite') {
                // Обновляем цвета рейтингов после загрузки информации
                setTimeout(updateVoteColors, 100);
            }
        });
    }

    // Функция инициализации плагина
    function startPlugin() {

        // Регистрируем плагин в Lampa
        Lampa.SettingsApi.addComponent({
            component: 'season_info',
            name: 'Интерфейс мод',
            icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V7C20 7.55228 19.5523 8 19 8H5C4.44772 8 4 7.55228 4 7V5Z" fill="currentColor"/><path d="M4 11C4 10.4477 4.44772 10 5 10H19C19.5523 10 20 10.4477 20 11V13C20 13.5523 19.5523 14 19 14H5C4.44772 14 4 13.5523 4 13V11Z" fill="currentColor"/><path d="M4 17C4 16.4477 4.44772 16 5 16H19C19.5523 16 20 16.4477 20 17V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V17Z" fill="currentColor"/></svg>'
        });
        
        // Добавляем настройки плагина
        Lampa.SettingsApi.addParam({
            component: 'season_info',
            param: { 
                type: 'button',
                component: 'about' 
            },
            field: {
                name: 'О плагине',
                description: 'Информация и поддержка'
            },
            onChange: showAbout
        });
        
        Lampa.SettingsApi.addParam({
            component: 'season_info',
            param: {
                name: 'season_info_enabled',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Информация о сезонах на постере',
                description: 'Отображать количество сезонов и серий на постере'
            },
            onChange: function (value) {
                InterFaceMod.settings.enabled = value;
                Lampa.Settings.update();
            }
        });
        
        Lampa.SettingsApi.addParam({
            component: 'season_info',
            param: {
                name: 'season_info_show_buttons',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Показывать все кнопки',
                description: 'Отображать все кнопки действий в карточке'
            },
            onChange: function (value) {
                InterFaceMod.settings.show_buttons = value;
                Lampa.Settings.update();
            }
        });
        
        Lampa.SettingsApi.addParam({
            component: 'season_info',
            param: {
                name: 'season_info_show_movie_type',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Изменить лейблы типа',
                description: 'Изменить "TV" на "Сериал" и добавить лейбл "Фильм"'
            },
            onChange: function (value) {
                InterFaceMod.settings.show_movie_type = value;
                Lampa.Settings.update();
            }
        });
        
        Lampa.SettingsApi.addParam({
            component: 'season_info',
            param: {
                name: 'theme_select',
                type: 'select',
                values: {
                    default: 'Нет',
                    bywolf_mod: 'bywolf_mod',
                    neon: 'Neon',
                    sunset: 'Dark MOD',
                    emerald: 'Emerald V1',
                    aurora: 'Aurora'
                },
                default: 'default'
            },
            field: {
                name: 'Тема интерфейса',
                description: 'Выберите тему оформления интерфейса'
            },
            onChange: function(value) {
                InterFaceMod.settings.theme = value;
                Lampa.Settings.update();
                applyTheme(value);
            }
        });
        
        Lampa.SettingsApi.addParam({
            component: 'season_info',
            param: {
                name: 'colored_ratings',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Цветные рейтинги',
                description: 'Изменять цвет рейтинга в зависимости от оценки'
            },
            onChange: function (value) {
                // Сохраняем текущий активный элемент
                var activeElement = document.activeElement;
                
                // Обновляем настройку
                InterFaceMod.settings.colored_ratings = value;
                Lampa.Settings.update();
                
                // Используем setTimeout для отложенного выполнения, 
                // чтобы не нарушать цикл обработки текущего события
                setTimeout(function() {
                    if (value) {
                        // Если включено, запускаем обновление цветов и наблюдатель
                        setupVoteColorsObserver();
                        setupVoteColorsForDetailPage();
                    } else {
                        // Если отключено, возвращаем стандартный цвет для всех элементов с рейтингом
                        document.querySelectorAll(".card__vote, .full-start__rate, .full-start-new__rate, .info__rate, .card__imdb-rate, .card__kinopoisk-rate").forEach(element => {
                            element.style.color = "";
                        });
                    }
                    
                    // Возвращаем фокус на активный элемент
                    if (activeElement && document.body.contains(activeElement)) {
                        activeElement.focus();
                    }
                }, 0);
            }
        });
        
        // Применяем настройки
        InterFaceMod.settings.enabled = Lampa.Storage.get('season_info_enabled', true);
        InterFaceMod.settings.show_buttons = Lampa.Storage.get('season_info_show_buttons', true);
        InterFaceMod.settings.show_movie_type = Lampa.Storage.get('season_info_show_movie_type', true);
        InterFaceMod.settings.theme = Lampa.Storage.get('theme_select', 'default');
        InterFaceMod.settings.colored_ratings = Lampa.Storage.get('colored_ratings', true);
        
        applyTheme(InterFaceMod.settings.theme);
        
        // Запускаем функции плагина в зависимости от настроек
        if (InterFaceMod.settings.enabled) {
            addSeasonInfo();
        }
        
        if (InterFaceMod.settings.show_buttons) {
            showAllButtons();
        }
        
        // Изменяем лейблы типа контента
        changeMovieTypeLabels();
        
        // Запускаем функцию цветных рейтингов и наблюдатель
        if (InterFaceMod.settings.colored_ratings) {
            setupVoteColorsObserver();
            // Добавляем слушатель для обновления цветов в детальной карточке
            setupVoteColorsForDetailPage();
        }
    }

function _0x1452(){var _0xc2c82a=['</h1>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22about-plugin__description\x22\x20style=\x22padding:\x2015px;\x20background:\x20rgba(15,\x202,\x2033,\x200.8);\x20border-radius:\x2010px;\x20margin-bottom:\x2020px;\x20border:\x201px\x20solid\x20rgba(252,\x200,\x20255,\x200.2);\x20animation:\x20border-pulse\x204s\x20infinite;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20style=\x22margin-bottom:\x2015px;\x20color:\x20#fff;\x20font-size:\x2016px;\x20line-height:\x201.5;\x20text-shadow:\x200\x200\x205px\x20rgba(0,\x20219,\x20222,\x200.3);\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20Плагин\x20улучшает\x20интерфейс\x20Lampa\x20с\x20разнообразными\x20функциями:\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<ul\x20style=\x22color:\x20#fff;\x20font-size:\x2015px;\x20line-height:\x201.5;\x20text-shadow:\x200\x200\x205px\x20rgba(0,\x20219,\x20222,\x200.3);\x20list-style-type:\x20none;\x20padding-left:\x2010px;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li\x20style=\x22margin-bottom:\x208px;\x20padding-left:\x2020px;\x20position:\x20relative;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20style=\x22position:\x20absolute;\x20left:\x200;\x20color:\x20#fc00ff;\x22>✦</span>\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20Информация\x20о\x20сезонах\x20и\x20сериях\x20в\x20двух\x20строках\x20на\x20постере\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li\x20style=\x22margin-bottom:\x208px;\x20padding-left:\x2020px;\x20position:\x20relative;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20style=\x22position:\x20absolute;\x20left:\x200;\x20color:\x20#fc00ff;\x22>✦</span>\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20Цветные\x20рейтинги\x20фильмов\x20и\x20сериалов\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li\x20style=\x22margin-bottom:\x208px;\x20padding-left:\x2020px;\x20position:\x20relative;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20style=\x22position:\x20absolute;\x20left:\x200;\x20color:\x20#fc00ff;\x22>✦</span>\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20Красивые\x20темы\x20оформления\x20интерфейса\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li\x20style=\x22margin-bottom:\x208px;\x20padding-left:\x2020px;\x20position:\x20relative;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20style=\x22position:\x20absolute;\x20left:\x200;\x20color:\x20#fc00ff;\x22>✦</span>\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20Отображение\x20всех\x20кнопок\x20в\x20карточке\x20фильма/сериала\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li\x20style=\x22margin-bottom:\x200;\x20padding-left:\x2020px;\x20position:\x20relative;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20style=\x22position:\x20absolute;\x20left:\x200;\x20color:\x20#fc00ff;\x22>✦</span>\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20Изменение\x20лейблов\x20типа\x20контента\x20на\x20\x22Фильм\x22\x20и\x20\x22Сериал\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</ul>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22about-plugin__author\x22\x20style=\x22padding:\x2015px;\x20background:\x20rgba(15,\x202,\x2033,\x200.8);\x20border-radius:\x2010px;\x20margin-bottom:\x2020px;\x20border:\x201px\x20solid\x20rgba(252,\x200,\x20255,\x200.2);\x20animation:\x20border-pulse\x204s\x20infinite;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20style=\x22display:\x20flex;\x20align-items:\x20center;\x20justify-content:\x20center;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20style=\x22width:\x2028px;\x20height:\x2028px;\x20margin-right:\x208px;\x20fill:\x20#00dbde;\x20filter:\x20drop-shadow(0\x200\x205px\x20rgba(0,\x20219,\x20222,\x200.7));\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20xmlns=\x22http://www.w3.org/2000/svg\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<path\x20d=\x22M12\x2012c2.21\x200\x204-1.79\x204-4s-1.79-4-4-4-4\x201.79-4\x204\x201.79\x204\x204\x204zm0\x202c-2.67\x200-8\x201.34-8\x204v2h16v-2c0-2.66-5.33-4-8-4z\x22></path>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</svg>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20style=\x22color:#fc00ff;\x20font-size:\x2018px;\x20margin-right:\x208px;\x20font-weight:\x20bold;\x20text-shadow:\x200\x200\x205px\x20rgba(252,\x200,\x20255,\x200.7);\x22>Автор:</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20style=\x22color:\x20#fff;\x20font-size:\x2016px;\x20text-shadow:\x200\x200\x205px\x20rgba(255,\x20255,\x20255,\x200.4);\x22>bywolf\x20(Лазарев\x20Иван)</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22about-plugin__support\x22\x20style=\x22padding:\x2015px;\x20background:\x20linear-gradient(90deg,\x20#fc00ff,\x20#00dbde);\x20border-radius:\x2010px;\x20text-align:\x20center;\x20animation:\x20cosmic-pulse\x202s\x20infinite;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h3\x20style=\x22margin-top:\x200;\x20color:\x20white;\x20font-size:\x2020px;\x20font-weight:\x20bold;\x20animation:\x20text-glow\x202s\x20infinite;\x22>Поддержать\x20разработку</h3>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20style=\x22color:\x20white;\x20font-size:\x2016px;\x20margin-bottom:\x2010px;\x20text-shadow:\x200\x200\x205px\x20rgba(255,\x20255,\x20255,\x200.5);\x22>OZON\x20Банк</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20style=\x22color:\x20white;\x20font-size:\x2022px;\x20font-weight:\x20bold;\x20margin-bottom:\x2010px;\x20text-shadow:\x200\x200\x208px\x20rgba(255,\x20255,\x20255,\x200.7);\x22>+7\x20953\x20235\x2000\x2002</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20style=\x22color:\x20#ffffff;\x20font-size:\x2014px;\x20text-shadow:\x200\x200\x208px\x20rgba(255,\x20255,\x20255,\x200.8);\x22>Владелец:\x20Иван\x20Л.</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20style=\x22color:\x20white;\x20font-size:\x2012px;\x20margin-top:\x2010px;\x20text-shadow:\x200\x200\x205px\x20rgba(255,\x20255,\x20255,\x200.5);\x22>Любая\x20помощь\x20мотивирует\x20на\x20развитие\x20плагина!</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20','medium','appendChild','27TsmQjd','getElementById','503144UjhVwd','open','about-plugin-styles','<div></div>','1954386BnvvPj','69024JcoYpD','settings','1554248PzlCan','html','version','remove','3njcIcl','toggle','455190itYEpA','\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20@keyframes\x20cosmic-pulse\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x200%\x20{\x20box-shadow:\x200\x200\x2020px\x20rgba(252,\x200,\x20255,\x200.3);\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x2050%\x20{\x20box-shadow:\x200\x200\x2030px\x20rgba(0,\x20219,\x20222,\x200.3);\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20100%\x20{\x20box-shadow:\x200\x200\x2020px\x20rgba(252,\x200,\x20255,\x200.3);\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20@keyframes\x20text-glow\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x200%\x20{\x20text-shadow:\x200\x200\x2010px\x20rgba(252,\x200,\x20255,\x200.7);\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x2050%\x20{\x20text-shadow:\x200\x200\x2015px\x20rgba(0,\x20219,\x20222,\x200.8);\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20100%\x20{\x20text-shadow:\x200\x200\x2010px\x20rgba(252,\x200,\x20255,\x200.7);\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20@keyframes\x20border-pulse\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x200%\x20{\x20border-color:\x20rgba(252,\x200,\x20255,\x200.6);\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x2050%\x20{\x20border-color:\x20rgba(0,\x20219,\x20222,\x200.8);\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20100%\x20{\x20border-color:\x20rgba(252,\x200,\x20255,\x200.6);\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20','createElement','2871522JRvXBW','Modal','close','533027kCGWuZ'];_0x1452=function(){return _0xc2c82a;};return _0x1452();}(function(_0x309ae1,_0xe68bec){var _0x4712f2=_0x1274,_0x32dd2e=_0x309ae1();while(!![]){try{var _0x45d271=-parseInt(_0x4712f2(0x157))/0x1+-parseInt(_0x4712f2(0x15d))/0x2*(-parseInt(_0x4712f2(0x14f))/0x3)+parseInt(_0x4712f2(0x149))/0x4+-parseInt(_0x4712f2(0x151))/0x5+parseInt(_0x4712f2(0x154))/0x6+-parseInt(_0x4712f2(0x148))/0x7+parseInt(_0x4712f2(0x14b))/0x8*(parseInt(_0x4712f2(0x15b))/0x9);if(_0x45d271===_0xe68bec)break;else _0x32dd2e['push'](_0x32dd2e['shift']());}catch(_0x52c744){_0x32dd2e['push'](_0x32dd2e['shift']());}}}(_0x1452,0x683f3));function _0x1274(_0x2f201f,_0x513601){var _0x145257=_0x1452();return _0x1274=function(_0x1274c4,_0x357fc6){_0x1274c4=_0x1274c4-0x147;var _0x3bae36=_0x145257[_0x1274c4];return _0x3bae36;},_0x1274(_0x2f201f,_0x513601);}function showAbout(){var _0xd9eae2=_0x1274,_0xc02f72=document[_0xd9eae2(0x153)]('style');_0xc02f72['id']=_0xd9eae2(0x15f),_0xc02f72['innerHTML']=_0xd9eae2(0x152),document['head'][_0xd9eae2(0x15a)](_0xc02f72);var _0x30d79d='\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22about-plugin\x22\x20style=\x22background:\x20rgba(9,\x202,\x2039,\x200.95);\x20border-radius:\x2015px;\x20overflow:\x20hidden;\x20padding:\x2010px;\x20box-shadow:\x200\x200\x2030px\x20rgba(0,\x20219,\x20222,\x200.1);\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22about-plugin__title\x22\x20style=\x22background:\x20linear-gradient(90deg,\x20#fc00ff,\x20#00dbde);\x20padding:\x2020px;\x20border-radius:\x2010px;\x20text-align:\x20center;\x20margin-bottom:\x2020px;\x20animation:\x20cosmic-pulse\x202s\x20infinite;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h1\x20style=\x22margin:\x200;\x20color:\x20white;\x20font-size:\x2028px;\x20font-weight:\x20bold;\x20animation:\x20text-glow\x202s\x20infinite;\x22>Интерфейс\x20MOD\x20bywolf\x20v'+InterFaceMod[_0xd9eae2(0x14d)]+_0xd9eae2(0x158),_0x4eac5b=$(_0xd9eae2(0x147));_0x4eac5b[_0xd9eae2(0x14c)](_0x30d79d),Lampa['Modal'][_0xd9eae2(0x15e)]({'title':'','html':_0x4eac5b,'onBack':function(){var _0x4c89e3=_0xd9eae2,_0x3ea2dd=document[_0x4c89e3(0x15c)](_0x4c89e3(0x15f));if(_0x3ea2dd)_0x3ea2dd[_0x4c89e3(0x14e)]();Lampa[_0x4c89e3(0x155)][_0x4c89e3(0x156)](),Lampa['Controller'][_0x4c89e3(0x150)](_0x4c89e3(0x14a));},'size':_0xd9eae2(0x159)});}


    // Ждем загрузки приложения и запускаем плагин
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') {
                startPlugin();
            }
        });
    }

    // Регистрация плагина в манифесте
    Lampa.Manifest.plugins = {
        name: 'Интерфейс мод',
        version: '2.1.0',
        description: 'Улучшенный интерфейс для приложения Lampa'
    };

    // Экспортируем объект плагина для внешнего доступа
    window.season_info = InterFaceMod;
})(); 
