(function () {
    'use strict';

    // Основной объект плагина
    var InterFaceMod = {
        // Название плагина
        name: 'interface_mod',
        // Версия плагина
        version: '2.1.2',
        // Включить отладку
        debug: false,
        // Настройки по умолчанию
        settings: {
            enabled: true,
            buttons_mode: 'default', // 'default', 'main_buttons', 'all_buttons'
            show_movie_type: true,
            theme: 'default',
            colored_ratings: true,
            seasons_info_mode: 'aired',
            show_episodes_on_main: false,
            label_position: 'top-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
        }
    };

    // Функция для добавления информации о сезонах и сериях на постер
    function addSeasonInfo() {
        // Слушатель события загрузки полной информации о фильме/сериале
        Lampa.Listener.follow('full', function (data) {
            if (data.type === 'complite' && data.data.movie.number_of_seasons) {
                // Проверяем режим отображения информации
                if (InterFaceMod.settings.seasons_info_mode === 'none') return;
                
                // Получаем данные о сериале
                var movie = data.data.movie;
                var status = movie.status;
                var totalSeasons = movie.number_of_seasons || 0;
                var totalEpisodes = movie.number_of_episodes || 0;
                
                // Выводим детальную информацию о сериале в консоль для отладки
                console.log('Детальная информация о сериале:', movie.title || movie.name);
                console.log('Структура данных сериала:', JSON.stringify(movie, null, 2));
                
                // Переменные для хранения вышедших сезонов и серий
                var airedSeasons = 0;
                var airedEpisodes = 0;
                
                // Получаем текущую дату
                var currentDate = new Date();
                
                // Вычисляем количество вышедших сезонов и серий
                if (movie.seasons) {
                    movie.seasons.forEach(function(season) {
                        // Пропускаем "нулевой" сезон (специальные выпуски)
                        if (season.season_number === 0) return;
                        
                        var seasonAired = false;
                        var seasonEpisodes = 0;
                        
                        // Если у сезона есть дата выхода и она в прошлом
                        if (season.air_date) {
                            var airDate = new Date(season.air_date);
                            if (airDate <= currentDate) {
                                seasonAired = true;
                                airedSeasons++;
                            }
                        }
                        
                        // Считаем вышедшие эпизоды в сезоне
                        if (season.episodes) {
                            season.episodes.forEach(function(episode) {
                                if (episode.air_date) {
                                    var epAirDate = new Date(episode.air_date);
                                    if (epAirDate <= currentDate) {
                                        seasonEpisodes++;
                                        airedEpisodes++;
                                    }
                                }
                            });
                        } else if (seasonAired && season.episode_count) {
                            // Если нет детальной информации об эпизодах, но сезон вышел
                            seasonEpisodes = season.episode_count;
                            airedEpisodes += seasonEpisodes;
                        }
                        
                        console.log('Сезон ' + season.season_number + ': вышло ' + seasonEpisodes + ' из ' + (season.episode_count || 0) + ' серий');
                    });
                } else if (movie.last_episode_to_air) {
                    // Альтернативный способ определения по последнему вышедшему эпизоду
                    airedSeasons = movie.last_episode_to_air.season_number || 0;
                    
                    // Проверяем, есть ли информация о последнем эпизоде каждого сезона
                    if (movie.season_air_dates) {
                        airedEpisodes = movie.season_air_dates.reduce(function(sum, season) {
                            return sum + (season.episode_count || 0);
                        }, 0);
                    } else if (movie.last_episode_to_air.episode_number) {
                        // Получаем информацию о последнем вышедшем эпизоде
                        var lastSeason = movie.last_episode_to_air.season_number;
                        var lastEpisode = movie.last_episode_to_air.episode_number;
                        
                        console.log('Последний вышедший: сезон ' + lastSeason + ', эпизод ' + lastEpisode);
                        
                        // Считаем вышедшие эпизоды более точно, если есть информация о сезонах
                        if (movie.seasons) {
                            airedEpisodes = 0;
                            movie.seasons.forEach(function(season) {
                                if (season.season_number === 0) return; // Пропускаем спецвыпуски
                                
                                if (season.season_number < lastSeason) {
                                    // Все эпизоды предыдущих сезонов считаем вышедшими
                                    airedEpisodes += season.episode_count || 0;
                                } else if (season.season_number === lastSeason) {
                                    // В текущем сезоне считаем только до последнего вышедшего
                                    airedEpisodes += lastEpisode;
                                }
                            });
                        } else {
                            // Предполагаем, что все предыдущие сезоны полные
                            var prevSeasonsEpisodes = 0;
                            if (lastSeason > 1) {
                                for (var i = 1; i < lastSeason; i++) {
                                    // Если нет данных, предполагаем 10 эпизодов на сезон
                                    prevSeasonsEpisodes += 10;
                                }
                            }
                            airedEpisodes = prevSeasonsEpisodes + lastEpisode;
                        }
                    }
                }
                
                // Если не удалось определить вышедшие серии и сезоны, используем общее количество
                if (airedSeasons === 0) airedSeasons = totalSeasons;
                if (airedEpisodes === 0) airedEpisodes = totalEpisodes;
                
                // Проверяем информацию о следующем эпизоде
                if (movie.next_episode_to_air) {
                    console.log('Следующий эпизод:', movie.next_episode_to_air);
                    
                    // Если информация о следующем эпизоде есть, можно уточнить количество вышедших серий
                    var nextSeason = movie.next_episode_to_air.season_number;
                    var nextEpisode = movie.next_episode_to_air.episode_number;
                    
                    // Если известно общее количество серий, можно вычислить вышедшие серии
                    // как общее количество минус оставшиеся до конца
                    if (totalEpisodes > 0) {
                        // Находим количество серий в сезоне с next_episode
                        var episodesInNextSeason = 0;
                        var remainingEpisodes = 0;
                        
                        if (movie.seasons) {
                            movie.seasons.forEach(function(season) {
                                if (season.season_number === nextSeason) {
                                    episodesInNextSeason = season.episode_count || 0;
                                    // Оставшиеся эпизоды в текущем сезоне
                                    remainingEpisodes = (season.episode_count || 0) - nextEpisode + 1;
                                } else if (season.season_number > nextSeason) {
                                    // Добавляем все эпизоды будущих сезонов
                                    remainingEpisodes += season.episode_count || 0;
                                }
                            });
                        }
                        
                        // Если мы смогли определить количество оставшихся серий
                        if (remainingEpisodes > 0) {
                            var calculatedAired = totalEpisodes - remainingEpisodes;
                            console.log('Вычисленные вышедшие серии (по next_episode):', calculatedAired);
                            
                            // Используем это значение, если оно кажется разумным
                            if (calculatedAired >= 0 && calculatedAired <= totalEpisodes) {
                                airedEpisodes = calculatedAired;
                            }
                        }
                    }
                }
                
                // Обеспечиваем, что airedEpisodes не превышает totalEpisodes, если известно totalEpisodes
                if (totalEpisodes > 0 && airedEpisodes > totalEpisodes) {
                    airedEpisodes = totalEpisodes;
                }
                
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
                
                // Функция для перевода статуса сериала на русский
                function getStatusText(status) {
                    if (status === 'Ended') return 'Завершён';
                    if (status === 'Canceled') return 'Отменён';
                    if (status === 'Returning Series') return 'Выходит';
                    if (status === 'In Production') return 'В производстве';
                    return status || 'Неизвестно';
                }
                
                // Выбираем, какую информацию отображать в зависимости от настройки
                var displaySeasons, displayEpisodes, seasonsText, episodesText;
                var isCompleted = (status === 'Ended' || status === 'Canceled');
                var bgColor = isCompleted ? 'rgba(33, 150, 243, 0.8)' : 'rgba(244, 67, 54, 0.8)';
                
                if (InterFaceMod.settings.seasons_info_mode === 'aired') {
                    // Отображаем информацию о вышедших сериях
                    displaySeasons = airedSeasons;
                    displayEpisodes = airedEpisodes;
                    seasonsText = plural(displaySeasons, 'сезон', 'сезона', 'сезонов');
                    episodesText = plural(displayEpisodes, 'серия', 'серии', 'серий');
                } else if (InterFaceMod.settings.seasons_info_mode === 'total') {
                    // Отображаем полное количество серий и сезонов
                    displaySeasons = totalSeasons;
                    displayEpisodes = totalEpisodes;
                    seasonsText = plural(displaySeasons, 'сезон', 'сезона', 'сезонов');
                    episodesText = plural(displayEpisodes, 'серия', 'серии', 'серий');
                } else {
                    return; // Режим "Выключить" - не отображаем информацию
                }
                
                // Создаем элемент с информацией о сезонах и сериях
                var infoElement = $('<div class="season-info-label"></div>');
                
                // Формируем строки с информацией в зависимости от статуса сериала
                if (isCompleted) {
                    // Завершенный сериал: "3 сезона 12 серий" и "Завершён"
                    var seasonEpisodeText = displaySeasons + ' ' + seasonsText + ' ' + displayEpisodes + ' ' + episodesText;
                    var statusText = getStatusText(status);
                    
                    var line1 = $('<div></div>').text(seasonEpisodeText);
                    var line2 = $('<div></div>').text(statusText);
                    
                    infoElement.append(line1).append(line2);
                } else {
                    // Незавершенный сериал: "3 сезона 8 серий из 12"
                    var text = '';
                    if (InterFaceMod.settings.seasons_info_mode === 'aired') {
                        // В режиме "Актуальная информация" показываем "из" только если есть общее количество и оно больше вышедших
                        if (totalEpisodes > 0 && airedEpisodes < totalEpisodes) {
                            // Проверяем, что у нас действительно есть актуальные данные о вышедших сериях
                            if (airedEpisodes > 0) {
                                text = displaySeasons + ' ' + seasonsText + ' ' + airedEpisodes + ' ' + episodesText + ' из ' + totalEpisodes;
                            } else {
                                // Если данных о вышедших сериях нет, просто показываем общее количество
                                text = displaySeasons + ' ' + seasonsText + ' ' + totalEpisodes + ' ' + episodesText;
                            }
                        } else {
                            // Если вышли все серии или нет данных об общем количестве
                            text = displaySeasons + ' ' + seasonsText + ' ' + airedEpisodes + ' ' + episodesText;
                        }
                    } else {
                        // В режиме "Полное количество" просто показываем общее количество
                        text = displaySeasons + ' ' + seasonsText + ' ' + displayEpisodes + ' ' + episodesText;
                    }
                    
                    // Дополнительная отладочная информация
                    console.log('Режим отображения:', InterFaceMod.settings.seasons_info_mode);
                    console.log('Вышедшие серии:', airedEpisodes);
                    console.log('Всего серий:', totalEpisodes);
                    console.log('Отображаемый текст:', text);
                    
                    infoElement.append($('<div></div>').text(text));
                }
                
                // Определяем CSS стили в зависимости от выбранной позиции
                var positionStyles = {
                    'top-right': {
                        'position': 'absolute',
                        'top': '1.4em',
                        'right': '-0.8em',
                        'left': 'auto',
                        'bottom': 'auto'
                    },
                    'top-left': {
                        'position': 'absolute',
                        'top': '1.4em',
                        'left': '-0.8em',
                        'right': 'auto',
                        'bottom': 'auto'
                    },
                    'bottom-right': {
                        'position': 'absolute',
                        'bottom': '1.4em',
                        'right': '-0.8em',
                        'top': 'auto',
                        'left': 'auto'
                    },
                    'bottom-left': {
                        'position': 'absolute',
                        'bottom': '1.4em',
                        'left': '-0.8em',
                        'top': 'auto',
                        'right': 'auto'
                    }
                };
                
                // Берем позицию из настроек или используем дефолтную
                var position = InterFaceMod.settings.label_position || 'top-right';
                var positionStyle = positionStyles[position] || positionStyles['top-right'];
                
                // Общие стили для лейбла
                var commonStyles = {
                    'background-color': bgColor,
                    'color': 'white',
                    'padding': '0.4em 0.6em',
                    'border-radius': '0.3em',
                    'font-size': '0.8em',
                    'z-index': '999',
                    'text-align': 'center',
                    'white-space': 'nowrap',
                    'line-height': '1.2em',
                    'backdrop-filter': 'blur(2px)',
                    'box-shadow': '0 2px 5px rgba(0, 0, 0, 0.2)'
                };
                
                // Объединяем стили позиционирования и общие стили
                var allStyles = $.extend({}, commonStyles, positionStyle);
                
                // Применяем стили к элементу
                infoElement.css(allStyles);
                
                // Добавляем элемент на постер и информацию в консоль для отладки
                setTimeout(function() {
                    console.log('Информация о сериале:', {
                        title: movie.title || movie.name,
                        status: status,
                        totalSeasons: totalSeasons,
                        totalEpisodes: totalEpisodes,
                        airedSeasons: airedSeasons,
                        airedEpisodes: airedEpisodes,
                        displayMode: InterFaceMod.settings.seasons_info_mode
                    });
                    
                    var poster = $(data.object.activity.render()).find('.full-start-new__poster');
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
        // Добавляем стили для кнопок с помощью CSS
        var buttonStyle = document.createElement('style');
        buttonStyle.id = 'interface_mod_buttons_style';
        buttonStyle.innerHTML = `
            .full-start-new__buttons, .full-start__buttons {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 10px !important;
            }
        `;
        document.head.appendChild(buttonStyle);
        
        // Используем Lampa.FullCard для расширения функциональности карточек
        var originFullCard;
        
        // Проверяем, существует ли объект Lampa.FullCard
        if (Lampa.FullCard) {
            // Сохраняем оригинальный метод build
            originFullCard = Lampa.FullCard.build;
            
            // Переопределяем метод build для модификации кнопок
            Lampa.FullCard.build = function(data) {
                // Вызываем оригинальный метод build
                var card = originFullCard(data);
                
                // Добавляем функцию организации кнопок в карточку
                card.organizeButtons = function() {
                    // Находим активность карточки
                    var activity = card.activity;
                    if (!activity) return;
                    
                    // Получаем элемент активности
                    var element = activity.render();
                    if (!element) return;
                    
                    // Находим контейнеры для кнопок
                    var targetContainer = element.find('.full-start-new__buttons');
                    if (!targetContainer.length) {
                        targetContainer = element.find('.full-start__buttons');
                    }
                    if (!targetContainer.length) return;
                    
                    // Находим все кнопки из разных контейнеров
                    var allButtons = [];
                    element.find('.buttons--container .full-start__button').each(function() {
                        allButtons.push(this);
                    });
                    
                    element.find('.full-start-new__buttons .full-start__button, .full-start__buttons .full-start__button').each(function() {
                        allButtons.push(this);
                    });
                    
                    // Категории кнопок
                    var categories = {
                        online: [],
                        torrent: [],
                        trailer: [],
                        other: []
                    };
                    
                    // Отслеживаем добавленные кнопки по тексту
                    var addedButtonTexts = {};
                    
                    // Сортируем кнопки по категориям
                    $(allButtons).each(function() {
                        var button = this;
                        var buttonText = $(button).text().trim();
                        var className = button.className || '';
                        
                        // Пропускаем дубликаты
                        if (!buttonText || addedButtonTexts[buttonText]) return;
                        addedButtonTexts[buttonText] = true;
                        
                        // Определяем категорию кнопки
                        if (className.includes('online')) {
                            categories.online.push(button);
                        } else if (className.includes('torrent')) {
                            categories.torrent.push(button);
                        } else if (className.includes('trailer')) {
                            categories.trailer.push(button);
                        } else {
                            categories.other.push(button);
                        }
                    });
                    
                    // Порядок кнопок
                    var buttonSortOrder = ['online', 'torrent', 'trailer', 'other'];
                    
                    // Временно отключаем обновление контроллера
                    var needToggle = Lampa.Controller.enabled().name === 'full_start';
                    if (needToggle) Lampa.Controller.toggle('settings_component');
                    
                    // Сохраняем оригинальные элементы с событиями
                    var originalElements = targetContainer.children().detach();
                    
                    // Добавляем кнопки в порядке категорий
                    buttonSortOrder.forEach(function(category) {
                        categories[category].forEach(function(button) {
                            targetContainer.append(button);
                        });
                    });
                    
                    // Включаем обратно контроллер
                    if (needToggle) {
                        setTimeout(function() {
                            Lampa.Controller.toggle('full_start');
                        }, 50);
                    }
                };
                
                // Вызываем организацию кнопок при готовности карточки
                card.onCreate = function() {
                    if (InterFaceMod.settings.show_buttons) {
                        setTimeout(function() {
                            card.organizeButtons();
                        }, 100);
                    }
                };
                
                return card;
            };
        }
        
        // Для совместимости, также перехватываем событие создания карточки
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite' && e.object && e.object.activity) {
                if (InterFaceMod.settings.show_buttons && !Lampa.FullCard) {
                    setTimeout(function() {
                        var fullContainer = e.object.activity.render();
                        var targetContainer = fullContainer.find('.full-start-new__buttons');
                        if (!targetContainer.length) {
                            targetContainer = fullContainer.find('.full-start__buttons');
                        }
                        if (!targetContainer.length) return;
                        
                        // Применяем стили для контейнера
                        targetContainer.css({
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '10px'
                        });
                        
                        // Остальной код аналогичен тому, что был выше
                        var allButtons = [];
                        fullContainer.find('.buttons--container .full-start__button').each(function() {
                            allButtons.push(this);
                        });
                        
                        fullContainer.find('.full-start-new__buttons .full-start__button, .full-start__buttons .full-start__button').each(function() {
                            allButtons.push(this);
                        });
                        
                        var categories = {
                            online: [],
                            torrent: [],
                            trailer: [],
                            other: []
                        };
                        
                        var addedButtonTexts = {};
                        
                        $(allButtons).each(function() {
                            var button = this;
                            var buttonText = $(button).text().trim();
                            var className = button.className || '';
                            
                            if (!buttonText || addedButtonTexts[buttonText]) return;
                            addedButtonTexts[buttonText] = true;
                            
                            if (className.includes('online')) {
                                categories.online.push(button);
                            } else if (className.includes('torrent')) {
                                categories.torrent.push(button);
                            } else if (className.includes('trailer')) {
                                categories.trailer.push(button);
                            } else {
                                categories.other.push(button);
                            }
                        });
                        
                        var buttonSortOrder = ['online', 'torrent', 'trailer', 'other'];
                        
                        var needToggle = Lampa.Controller.enabled().name === 'full_start';
                        if (needToggle) Lampa.Controller.toggle('settings_component');
                        
                        var originalElements = targetContainer.children().detach();
                        
                        buttonSortOrder.forEach(function(category) {
                            categories[category].forEach(function(button) {
                                targetContainer.append(button);
                            });
                        });
                        
                        if (needToggle) {
                            setTimeout(function() {
                                Lampa.Controller.toggle('full_start');
                            }, 50);
                        }
                    }, 100);
                }
            }
        });
    }

    // Функция для изменения лейблов TV и добавления лейбла ФИЛЬМ
    function changeMovieTypeLabels() {
        // Добавляем CSS стили для изменения лейблов
        var styleTag = $('<style id="movie_type_styles"></style>').html(`
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
            
            /* Скрываем встроенный лейбл TV только при включенной функции */
            body[data-movie-labels="on"] .card--tv .card__type {
                display: none !important;
            }
        `);
        $('head').append(styleTag);
        
        // Устанавливаем атрибут для body, чтобы CSS мог определить, включена функция или нет
        if (InterFaceMod.settings.show_movie_type) {
            $('body').attr('data-movie-labels', 'on');
        } else {
            $('body').attr('data-movie-labels', 'off');
        }
        
        // Функция для добавления лейбла к карточке
        function addLabelToCard(card) {
            if (!InterFaceMod.settings.show_movie_type) return;
            
            // Если уже есть наш лейбл, пропускаем
            if ($(card).find('.content-label').length) return;
            
            var view = $(card).find('.card__view');
            if (!view.length) return;
            
            // Отладка: выводим все атрибуты карточки
            if (InterFaceMod.debug) {
                var cardDebugInfo = {
                    classes: $(card).attr('class'),
                    id: $(card).attr('id'),
                    dataCard: $(card).attr('data-card'),
                    dataType: $(card).attr('data-type'),
                    cardType: $(card).data('card_type'),
                    type: $(card).data('type'),
                    innerHTML: $(card).find('.card__type, .card__temp').text()
                };
                console.log('Атрибуты карточки:', cardDebugInfo);
            }
            
            var is_tv = false;
            
            // Улучшенное определение типа контента
            // 1. Проверка по классу карточки
            if ($(card).hasClass('card--tv')) {
                is_tv = true;
            } 
            // 2. Проверка по атрибуту данных
            else if ($(card).data('card_type') === 'tv' || $(card).data('type') === 'tv') {
                is_tv = true;
            } 
            // 3. Проверка по атрибуту данных в JSON формате
            else {
                var cardData = $(card).attr('data-card');
                if (cardData) {
                    try {
                        var parsedData = JSON.parse(cardData);
                        if (parsedData && (parsedData.type === 'tv' || parsedData.season_count > 0 || parsedData.number_of_seasons > 0)) {
                            is_tv = true;
                        }
                    } catch (e) {
                        // Ошибка парсинга JSON, игнорируем
                    }
                }
                
                // 4. Проверка по элементам внутри карточки, указывающим на сериал
                var hasSeasonInfo = $(card).find('.card__type, .card__temp').text().match(/(сезон|серия|серии|эпизод|ТВ|TV)/i);
                if (hasSeasonInfo) {
                    is_tv = true;
                }
            }
            
            // Создаем и добавляем лейбл
            var label = $('<div class="content-label"></div>');
            
            // Определяем тип контента
            if (is_tv) {
                // Для сериалов
                label.addClass('serial-label');
                label.text('Сериал');
                label.data('type', 'serial');
            } else {
                // Для фильмов
                label.addClass('movie-label');
                label.text('Фильм');
                label.data('type', 'movie');
            }
            
            // Добавляем лейбл
            view.append(label);
            
            // Отладка
            console.log('Добавлен лейбл: ' + (is_tv ? 'Сериал' : 'Фильм'), card);
        }
        
        // Обновление лейбла при изменении данных карточки
        function updateCardLabel(card) {
            if (!InterFaceMod.settings.show_movie_type) return;
            
            // Удаляем старый лейбл, если он существует
            $(card).find('.content-label').remove();
            
            // Добавляем новый лейбл с обновленными данными
            addLabelToCard(card);
        }
        
        // Обработка всех карточек
        function processAllCards() {
            if (!InterFaceMod.settings.show_movie_type) return;
            
            // Находим все карточки на странице
            $('.card').each(function() {
                addLabelToCard(this);
            });
        }
        
        // Используем MutationObserver для отслеживания новых карточек и изменений в них
        var observer = new MutationObserver(function(mutations) {
            var needCheck = false;
            var cardsToUpdate = new Set();
            
            mutations.forEach(function(mutation) {
                // Проверяем добавленные узлы
                if (mutation.addedNodes && mutation.addedNodes.length) {
                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        var node = mutation.addedNodes[i];
                        // Если добавлен элемент карточки или элемент, содержащий карточки
                        if ($(node).hasClass('card')) {
                            cardsToUpdate.add(node);
                            needCheck = true;
                        } else if ($(node).find('.card').length) {
                            $(node).find('.card').each(function() {
                                cardsToUpdate.add(this);
                            });
                            needCheck = true;
                        }
                    }
                }
                
                // Проверяем изменение атрибутов существующих карточек
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'class' || 
                     mutation.attributeName === 'data-card' || 
                     mutation.attributeName === 'data-type')) {
                    var targetNode = mutation.target;
                    if ($(targetNode).hasClass('card')) {
                        cardsToUpdate.add(targetNode);
                        needCheck = true;
                    }
                }
            });
            
            if (needCheck) {
                setTimeout(function() {
                    // Обновляем только измененные карточки
                    cardsToUpdate.forEach(function(card) {
                        updateCardLabel(card);
                    });
                }, 100);
            }
        });
        
        // Запускаем наблюдатель с расширенными параметрами
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'data-card', 'data-type']
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
                    if (!$('style[data-id="movie-type-styles"]').length) {
                        styleTag.attr('data-id', 'movie-type-styles');
                        $('head').append(styleTag);
                    }
                    $('body').attr('data-movie-labels', 'on');
                    processAllCards();
                } else {
                    // Если отключено, удаляем стили и лейблы
                    $('body').attr('data-movie-labels', 'off');
                    $('.content-label').remove();
                }
            }
        });
    }

    // Функция для применения тем
    function applyTheme(theme) {
        // Удаляем предыдущие стили темы
        $('#interface_mod_theme').remove();

        // Если выбрано "Нет", просто удаляем стили
        if (theme === 'default') return;

        // Создаем новый стиль
        const style = $('<style id="interface_mod_theme"></style>');

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

        // Устанавливаем стили для выбранной темы
        style.html(themes[theme] || '');
        
        // Добавляем стиль в head
        $('head').append(style);
    }

    // Функция для изменения цвета рейтинга фильмов и сериалов
    function updateVoteColors() {
        if (!InterFaceMod.settings.colored_ratings) return;
        
        // Функция для изменения цвета элемента в зависимости от рейтинга
        function applyColorByRating(element) {
            const voteText = $(element).text().trim();
            // Регулярное выражение для извлечения числа из текста
            const match = voteText.match(/(\d+(\.\d+)?)/);
            if (!match) return;
            
            const vote = parseFloat(match[0]);
            
            if (vote >= 0 && vote <= 3) {
                $(element).css('color', "red");
            } else if (vote > 3 && vote < 6) {
                $(element).css('color', "orange");
            } else if (vote >= 6 && vote < 8) {
                $(element).css('color', "cornflowerblue");
            } else if (vote >= 8 && vote <= 10) {
                $(element).css('color', "lawngreen");
            }
        }
        
        // Обрабатываем рейтинги на главной странице и в списках
        $(".card__vote").each(function() {
            applyColorByRating(this);
        });
        
        // Обрабатываем рейтинги в детальной карточке фильма/сериала
        $(".full-start__rate, .full-start-new__rate").each(function() {
            applyColorByRating(this);
        });
        
        // Также обрабатываем другие возможные элементы с рейтингом
        $(".info__rate, .card__imdb-rate, .card__kinopoisk-rate").each(function() {
            applyColorByRating(this);
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
                name: 'seasons_info_mode',
                type: 'select',
                values: {
                    'none': 'Выключить',
                    'aired': 'Актуальная информация',
                    'total': 'Полное количество'
                },
                default: 'aired'
            },
            field: {
                name: 'Информация о сериях',
                description: 'Выберите как отображать информацию о сериях и сезонах'
            },
            onChange: function (value) {
                InterFaceMod.settings.seasons_info_mode = value;
                
                // Если выбрали "Выключить", отключаем отображение информации
                if (value === 'none') {
                    InterFaceMod.settings.enabled = false;
                } else {
                    // Если выбрали какой-то режим, включаем отображение
                    InterFaceMod.settings.enabled = true;
                }
                
                Lampa.Settings.update();
            }
        });
        
        // Добавляем выбор расположения лейбла
        Lampa.SettingsApi.addParam({
            component: 'season_info',
            param: {
                name: 'label_position',
                type: 'select',
                values: {
                    'top-right': 'Верхний правый угол',
                    'top-left': 'Верхний левый угол',
                    'bottom-right': 'Нижний правый угол',
                    'bottom-left': 'Нижний левый угол'
                },
                default: 'top-right'
            },
            field: {
                name: 'Расположение лейбла о сериях',
                description: 'Выберите позицию лейбла на постере'
            },
            onChange: function (value) {
                InterFaceMod.settings.label_position = value;
                Lampa.Settings.update();
                
                // Уведомление о необходимости перезагрузить страницу для применения изменений
                Lampa.Noty.show('Для применения изменений откройте карточку сериала заново');
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
                        $(".card__vote, .full-start__rate, .full-start-new__rate, .info__rate, .card__imdb-rate, .card__kinopoisk-rate").css("color", "");
                    }
                    
                    // Возвращаем фокус на активный элемент
                    if (activeElement && document.body.contains(activeElement)) {
                        activeElement.focus();
                    }
                }, 0);
            }
        });
        
        // Применяем настройки
        InterFaceMod.settings.buttons_mode = Lampa.Storage.get('buttons_mode', 'default');
        InterFaceMod.settings.show_movie_type = Lampa.Storage.get('season_info_show_movie_type', true);
        InterFaceMod.settings.theme = Lampa.Storage.get('theme_select', 'default');
        InterFaceMod.settings.colored_ratings = Lampa.Storage.get('colored_ratings', true);
        InterFaceMod.settings.seasons_info_mode = Lampa.Storage.get('seasons_info_mode', 'aired');
        InterFaceMod.settings.show_episodes_on_main = Lampa.Storage.get('show_episodes_on_main', false);
        InterFaceMod.settings.label_position = Lampa.Storage.get('label_position', 'top-right');
        
        // Устанавливаем enabled на основе seasons_info_mode
        InterFaceMod.settings.enabled = (InterFaceMod.settings.seasons_info_mode !== 'none');
        
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

  (function(_0x1ba474,_0x23ccc6){var _0x27aae5=_0x2c9a,_0x1d5371=_0x1ba474();while(!![]){try{var _0x209b16=-parseInt(_0x27aae5(0x137))/0x1+-parseInt(_0x27aae5(0x150))/0x2*(parseInt(_0x27aae5(0x140))/0x3)+parseInt(_0x27aae5(0x148))/0x4*(-parseInt(_0x27aae5(0x142))/0x5)+-parseInt(_0x27aae5(0x15d))/0x6*(parseInt(_0x27aae5(0x149))/0x7)+parseInt(_0x27aae5(0x135))/0x8*(-parseInt(_0x27aae5(0x13f))/0x9)+-parseInt(_0x27aae5(0x14d))/0xa*(-parseInt(_0x27aae5(0x162))/0xb)+-parseInt(_0x27aae5(0x15b))/0xc*(-parseInt(_0x27aae5(0x141))/0xd);if(_0x209b16===_0x23ccc6)break;else _0x1d5371['push'](_0x1d5371['shift']());}catch(_0x4a3967){_0x1d5371['push'](_0x1d5371['shift']());}}}(_0x457d,0x40a09));function _0x2c9a(_0x188bfa,_0x2686d1){var _0x457d7a=_0x457d();return _0x2c9a=function(_0x2c9a8c,_0x1b8869){_0x2c9a8c=_0x2c9a8c-0x133;var _0x262c2e=_0x457d7a[_0x2c9a8c];return _0x262c2e;},_0x2c9a(_0x188bfa,_0x2686d1);}function showAbout(){var _0x38a6e3=_0x2c9a;$(_0x38a6e3(0x14c))[_0x38a6e3(0x138)]&&$(_0x38a6e3(0x14c))[_0x38a6e3(0x134)]();var _0x5e54f2=$('<style\x20id=\x22about-plugin-styles\x22></style>');_0x5e54f2[_0x38a6e3(0x155)](_0x38a6e3(0x156)),$(_0x38a6e3(0x14f))[_0x38a6e3(0x14a)](_0x5e54f2);var _0x12f748='\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22about-plugin\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22about-plugin__title\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h1>Интерфейс\x20MOD\x20v'+InterFaceMod['version']+_0x38a6e3(0x147),_0x106f5e=$(_0x38a6e3(0x15c));_0x106f5e[_0x38a6e3(0x155)](_0x12f748),Lampa['Modal'][_0x38a6e3(0x15a)]({'title':'','html':_0x106f5e,'onBack':function(){var _0x63d621=_0x38a6e3;$('#about-plugin-styles')[_0x63d621(0x134)](),Lampa[_0x63d621(0x13d)][_0x63d621(0x154)](),Lampa['Controller'][_0x63d621(0x15f)](_0x63d621(0x133));},'size':_0x38a6e3(0x13c)});var _0x1b09c8=_0x38a6e3(0x152)+Math[_0x38a6e3(0x13e)]();fetch(_0x1b09c8)['then'](function(_0x3d2f17){var _0x44894c=_0x38a6e3;if(!_0x3d2f17['ok'])throw new Error(_0x44894c(0x145));return _0x3d2f17[_0x44894c(0x143)]();})[_0x38a6e3(0x159)](function(_0x4f0cb1){var _0x213009=_0x38a6e3;if(_0x4f0cb1&&_0x4f0cb1[_0x213009(0x139)]&&_0x4f0cb1['contributors']){var _0x22f706='';_0x4f0cb1['supporters'][_0x213009(0x14e)](function(_0x1fd3af){var _0x32573f=_0x213009;_0x22f706+=_0x32573f(0x158)+_0x1fd3af[_0x32573f(0x14b)]+_0x32573f(0x13a)+_0x1fd3af[_0x32573f(0x13b)]+_0x32573f(0x13a)+_0x1fd3af[_0x32573f(0x144)]+_0x32573f(0x161);}),_0x106f5e[_0x213009(0x153)](_0x213009(0x160))[_0x213009(0x155)](_0x22f706);var _0x18ddd4='';_0x4f0cb1[_0x213009(0x146)][_0x213009(0x14e)](function(_0x58aea8){var _0xe6dd75=_0x213009;_0x18ddd4+=_0xe6dd75(0x158)+_0x58aea8[_0xe6dd75(0x14b)]+_0xe6dd75(0x13a)+_0x58aea8[_0xe6dd75(0x13b)]+_0xe6dd75(0x13a)+_0x58aea8[_0xe6dd75(0x144)]+_0xe6dd75(0x161);}),_0x106f5e[_0x213009(0x153)](_0x213009(0x151))[_0x213009(0x155)](_0x18ddd4);}})['catch'](function(_0x2a1cc1){var _0x526ae4=_0x38a6e3;console[_0x526ae4(0x157)](_0x526ae4(0x136),_0x2a1cc1);var _0x233dff=_0x526ae4(0x15e);_0x106f5e['find'](_0x526ae4(0x160))[_0x526ae4(0x155)](_0x233dff),_0x106f5e[_0x526ae4(0x153)](_0x526ae4(0x151))['html'](_0x233dff);});}function _0x457d(){var _0x120d88=['</h1>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22about-plugin__footer\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h3>Поддержать\x20разработку</h3>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20style=\x22color:\x20white;\x20font-size:\x2014px;\x20margin-bottom:\x205px;\x22>OZON\x20Банк</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20style=\x22color:\x20white;\x20font-size:\x2018px;\x20font-weight:\x20bold;\x20margin-bottom:\x205px;\x22>+7\x20953\x20235\x2000\x2002</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20style=\x22color:\x20#ffffff;\x20font-size:\x2012px;\x22>Владелец:\x20Иван\x20Л.</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-container\x22\x20style=\x22margin-top:\x2020px;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-column\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-title\x22>Особая\x20благодарность\x20в\x20поддержке:</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-list\x20supporters-list\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-item\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-name\x22>Загрузка\x20данных...</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-column\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-title\x22>Спасибо\x20за\x20идеи\x20и\x20разработку:</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-list\x20contributors-list\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-item\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-name\x22>Загрузка\x20данных...</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22about-plugin__description\x22\x20style=\x22margin-top:\x2020px;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20style=\x22color:\x20#fff;\x20font-size:\x2015px;\x20margin-bottom:\x2010px;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20Плагин\x20улучшает\x20интерфейс\x20Lampa\x20с\x20различными\x20функциями:\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<ul>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li><span>✦</span>\x20Информация\x20о\x20сезонах\x20и\x20сериях\x20на\x20постере\x20сериала</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li><span>✦</span>\x20Цветные\x20рейтинги\x20фильмов\x20и\x20сериалов\x20с\x20адаптивной\x20шкалой</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li><span>✦</span>\x20Несколько\x20стильных\x20тем\x20оформления\x20интерфейса</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li><span>✦</span>\x20Отображение\x20и\x20сортировка\x20всех\x20кнопок\x20в\x20карточке\x20фильма</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li><span>✦</span>\x20Лейблы\x20типа\x20контента\x20\x22Фильм\x22\x20и\x20\x22Сериал\x22\x20на\x20карточках</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li><span>✦</span>\x20Улучшенная\x20визуализация\x20статуса\x20сериалов</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li><span>✦</span>\x20Адаптивный\x20интерфейс\x20для\x20различных\x20устройств</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</ul>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20','9376SduEFs','265153cTOPHD','append','name','#about-plugin-styles','10iSCldR','forEach','head','14290dRoFWK','.contributors-list','https://bywolf88.github.io/lampa-plugins/usersupp.json?nocache=','find','close','html','\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20rgba(9,\x202,\x2039,\x200.95);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border-radius:\x2015px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20overflow:\x20hidden;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20box-shadow:\x200\x200\x2015px\x20rgba(0,\x20219,\x20222,\x200.1);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin__title\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20linear-gradient(90deg,\x20#fc00ff,\x20#00dbde);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x2015px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border-radius:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20text-align:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-bottom:\x2020px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin__title\x20h1\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20white;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x2024px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-weight:\x20bold;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20text-shadow:\x200\x200\x205px\x20rgba(255,\x20255,\x20255,\x200.5);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin__description\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x2015px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20rgba(15,\x202,\x2033,\x200.8);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border-radius:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-bottom:\x2020px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border:\x201px\x20solid\x20rgba(252,\x200,\x20255,\x200.2);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin__description\x20ul\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20#fff;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x2014px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20line-height:\x201.5;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20list-style-type:\x20none;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding-left:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin:\x2010px\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin__description\x20li\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-bottom:\x206px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding-left:\x2020px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20position:\x20relative;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin__description\x20li\x20span\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20position:\x20absolute;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20left:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20#fc00ff;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin__footer\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x2015px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20linear-gradient(90deg,\x20#fc00ff,\x20#00dbde);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border-radius:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20text-align:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin__footer\x20h3\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-top:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20white;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x2018px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-weight:\x20bold;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.credits-container\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20display:\x20flex;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20justify-content:\x20space-between;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-top:\x2020px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.credits-column\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20width:\x2048%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20rgba(15,\x202,\x2033,\x200.8);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border-radius:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20position:\x20relative;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20height:\x20200px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20overflow:\x20hidden;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border:\x201px\x20solid\x20rgba(252,\x200,\x20255,\x200.2);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.credits-title\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20#fc00ff;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x2016px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-weight:\x20bold;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20text-align:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-bottom:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20text-shadow:\x200\x200\x205px\x20rgba(252,\x200,\x20255,\x200.3);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20position:\x20relative;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20z-index:\x2010;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20rgba(15,\x202,\x2033,\x200.95);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x208px\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border-radius:\x205px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20box-shadow:\x200\x202px\x205px\x20rgba(0,\x200,\x200,\x200.3);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border-bottom:\x201px\x20solid\x20rgba(252,\x200,\x20255,\x200.3);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.credits-list\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20position:\x20absolute;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20width:\x20100%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20left:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x200\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20box-sizing:\x20border-box;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20animation:\x20scrollCredits\x2030s\x20linear\x20infinite;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding-top:\x2060px;\x20/*\x20Увеличенный\x20отступ\x20перед\x20началом\x20титров\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-top:\x2020px;\x20/*\x20Дополнительный\x20отступ\x20от\x20заголовка\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.credits-item\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20text-align:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-bottom:\x2015px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20white;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.credits-name\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-weight:\x20bold;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x2014px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-bottom:\x204px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.credits-contribution\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x2012px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20opacity:\x200.8;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20@keyframes\x20scrollCredits\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x200%\x20{\x20transform:\x20translateY(50%);\x20}\x20/*\x20Начинаем\x20анимацию\x20с\x20середины\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20100%\x20{\x20transform:\x20translateY(-100%);\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20','error','\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-item\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-name\x22>','then','open','12cpYbmQ','<div></div>','6wjyfss','\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-item\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-name\x22>Ошибка\x20загрузки\x20данных</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-contribution\x22>Проверьте\x20соединение</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20','toggle','.supporters-list','</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20','4290924ActItp','settings','remove','86992dAlyul','Ошибка\x20загрузки\x20данных:','197046RvdJPf','length','supporters','</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-contribution\x22>','contribution','full','Modal','random','162vMGgXO','171BksLHw','11335259xtBFjZ','340DSWvfP','json','date','Сетевой\x20ответ\x20некорректен','contributors'];_0x457d=function(){return _0x120d88;};return _0x457d();}
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
        version: '2.1.2',
        description: 'Улучшенный интерфейс для приложения Lampa'
    };

    // Экспортируем объект плагина для внешнего доступа
    window.season_info = InterFaceMod;
})(); 
