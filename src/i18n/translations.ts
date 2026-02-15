// თარგმანები / Translations / Переводы
export const translations = {
  // ინგლისური / English / Английский
  en: {
    nav: {
      brand: "Lumina Vids",
      generate: "Generate",           // გენერაცია / Генерация
      outputs: "Outputs",             // შედეგები / Результаты
      help: "Help",                   // დახმარება / Помощь
    },
    generate: {
      input_images: "Input Images",   // შესატანი სურათები / Входные изображения
      drag_drop: "Drag & drop images here",  // ჩააგდეთ სურათები აქ / Перетащите изображения сюда
      click_browse: "or click to browse",    // ან დააჭირეთ ასარჩევად / или нажмите для выбора
      images_selected: "{{count}} images selected",  // {{count}} სურათი არჩეულია / Выбрано {{count}} изображений
      settings: "Settings",           // პარამეტრები / Настройки
      property_id: "Property ID",     // ქონების ID / ID объекта
      property_id_placeholder: "e.g. p123",  // მაგ. p123 / например p123
      duration: "Duration per Image (s)",    // ხანგრძლივობა სურათზე (წმ) / Длительность на изображение (сек)
      fps: "FPS (Frames Per Second)", // FPS (კადრი წამში) / FPS (кадров в секунду)
      transition: "Transition",       // გადასვლა / Переход
      transition_cut: "Cut (Sharp)",  // ჭრა (მკვეთრი) / Срез (резкий)
      transition_fade: "Fade (Smooth)",      // გადასვლა (რბილი) / Fade (плавный)
      transition_slide_left: "Slide Left",   // სლაიდი მარცხნივ / Сдвиг влево
      transition_slide_right: "Slide Right", // სლაიდი მარჯვნივ / Сдвиг вправо
      transition_slide_up: "Slide Up",       // სლაიდი ზემოთ / Сдвиг вверх
      transition_slide_down: "Slide Down",   // სლაიდი ქვემოთ / Сдвиг вниз
      transition_zoom_in: "Zoom In",         // ზუმი (შემოსვლა) / Приближение
      transition_zoom_out: "Zoom Out",       // ზუმი (გასვლა) / Отдаление
      transition_wipe_left: "Wipe Left",     // გადაწევა მარცხნივ / Протирание влево
      transition_wipe_right: "Wipe Right",   // გადაწევა მარჯვნივ / Протирание вправо
      transition_wipe_up: "Wipe Up",         // გადაწევა ზემოთ / Протирание вверх
      transition_wipe_down: "Wipe Down",     // გადაწევა ქვემოთ / Протирание вниз
      transition_pixelate: "Pixelate",       // პიქსელიზაცია / Пикселизация
      transition_ripple: "Ripple",           // ტალღა / Рябь
      transition_page_curl: "Page Curl",     // გვერდის ათვლა / Завиток страницы
      transition_circle_open: "Circle Open", // წრის გახსნა / Открытие кругом
      transition_circle_close: "Circle Close", // წრის დახურვა / Закрытие кругом
      transition_spin_in: "Spin In",         // ბრუნვა (შემოსვლა) / Вращение (вход)
      transition_spin_out: "Spin Out",       // ბრუნვა (გასვლა) / Вращение (выход)
      transition_fly_in: "Fly In",           // შემოფრენა / Прилет
      transition_fly_out: "Fly Out",         // გაფრენა / Улет
      transition_duration: "Transition Duration (s)", // გადასვლის ხანგრძლივობა / Длительность перехода
      auto_duration: "Auto Duration",        // ავტო ხანგრძლივობა / Авто длительность
      music_label: "Background Music",       // ფონური მუსიკა / Фоновая музыка
      music_volume: "Volume",               // ხმა / Громкость
      estimated_duration: "Estimated Duration:", // სავარაუდო დრო / Предполагаемая длительность
      btn_generate: "Generate 4 Videos",    // 4 ვიდეოს გენერაცია / Сгенерировать 4 видео
      btn_cancel: "Cancel",                 // გაუქმება / Отмена
      btn_view_outputs: "View Outputs",     // შედეგების ნახვა / Просмотр результатов
      status_queued: "Queued...",           // რიგშია... / В очереди...
      status_rendering: "Rendering...",     // მუშავდება... / Рендеринг...
      status_success: "Success!",           // დასრულდა! / Успех!
      status_error: "Error occurred. Check settings or images.", // შეცდომა. შეამოწმეთ პარამეტრები ან სურათები. / Ошибка. Проверьте настройки или изображения.
      presets: "Social Media Presets",      // სოც. ქსელის პარამეტრები / Пресеты соц. сетей
    },
    outputs: {
      title: "Run History",               // ისტორია / История
      no_runs: "No runs yet",             // ჩანაწერები არ არის / Записей пока нет
      select_job: "Select a job to view details", // აირჩიეთ ჩანაწერი დეტალების სანახავად / Выберите запись для просмотра деталей
      status_label: "Status:",            // სტატუსი: / Статус:
      btn_download_zip: "Download ZIP",   // ZIP გადმოწერა / Скачать ZIP
      untitled: "Untitled",               // უსათაურო / Без названия
    },
    help: {
      title: "How to use Lumina Vids",    // როგორ გამოვიყენოთ Lumina Vids / Как использовать Lumina Vids
      description: "Generate high-quality slideshow videos locally.", // შექმენით მაღალი ხარისხის სლაიდშოუ ვიდეოები ლოკალურად. / Создавайте высококачественные слайд-шоу локально.
      quick_start: "Quick Start",         // სწრაფი დაწყება / Быстрый старт
      step_1: "Go to the 'Generate' page.",
      step_2: "Drag and drop your images into the upload area.",
      step_3: "Enter a Property ID (used for filenames).",
      step_4: "Adjust FPS, Duration, or Transition settings if needed.",
      step_5: "Click 'Generate 4 Videos'.",
      step_6: "Wait for the process to complete (concurrency is limited to 1 job at a time).",
      step_7: "Download the resulting ZIP file containing all 4 video formats.",
      formats_title: "Formats & Output",
      formats_desc: "The system always generates 4 videos for every run:",
      troubleshooting: "Troubleshooting",
      ts_ffmpeg: "FFmpeg not found: Ensure FFmpeg is installed and added to your system PATH.",
      ts_python: "Python errors: Check that Python 3.x is installed and moviepy, Pillow, numpy are installed.",
      ts_stuck: "Rendering stuck: Only one job runs at a time. If a job hangs, click 'Cancel' or restart the server.",
    },
  },
  
  // ქართული / Georgian / Грузинский
  ka: {
    nav: {
      brand: "Lumina Vids",
      generate: "გენერაცია",
      outputs: "შედეგები",
      help: "დახმარება",
    },
    generate: {
      input_images: "სურათების ატვირთვა",
      drag_drop: "ჩააგდეთ სურათები აქ",
      click_browse: "ან დააჭირეთ ასარჩევად",
      images_selected: "{{count}} სურათი არჩეულია",
      settings: "პარამეტრები",
      property_id: "ქონების ID",
      property_id_placeholder: "მაგ. p123",
      duration: "ხანგრძლივობა სურათზე (წმ)",
      fps: "FPS (კადრი წამში)",
      transition: "გადასვლა",
      transition_cut: "ჭრა (მკვეთრი)",
      transition_fade: "გადასვლა (რბილი)",
      transition_slide_left: "სლაიდი მარცხნივ",
      transition_slide_right: "სლაიდი მარჯვნივ",
      transition_slide_up: "სლაიდი ზემოთ",
      transition_slide_down: "სლაიდი ქვემოთ",
      transition_zoom_in: "ზუმი (შემოსვლა)",
      transition_zoom_out: "ზუმი (გასვლა)",
      transition_wipe_left: "გადაწევა მარცხნივ",
      transition_wipe_right: "გადაწევა მარჯვნივ",
      transition_wipe_up: "გადაწევა ზემოთ",
      transition_wipe_down: "გადაწევა ქვემოთ",
      transition_pixelate: "პიქსელიზაცია",
      transition_ripple: "ტალღა",
      transition_page_curl: "გვერდის ათვლა",
      transition_circle_open: "წრის გახსნა",
      transition_circle_close: "წრის დახურვა",
      transition_spin_in: "ბრუნვა (შემოსვლა)",
      transition_spin_out: "ბრუნვა (გასვლა)",
      transition_fly_in: "შემოფრენა",
      transition_fly_out: "გაფრენა",
      transition_duration: "გადასვლის ხანგრძლივობა (წმ)",
      auto_duration: "ავტო ხანგრძლივობა",
      music_label: "ფონური მუსიკა",
      music_volume: "ხმა",
      estimated_duration: "სავარაუდო დრო:",
      btn_generate: "4 ვიდეოს გენერაცია",
      btn_cancel: "გაუქმება",
      btn_view_outputs: "შედეგების ნახვა",
      status_queued: "რიგშია...",
      status_rendering: "მუშავდება...",
      status_success: "დასრულდა!",
      status_error: "შეცდომა. შეამოწმეთ პარამეტრები ან სურათები.",
      presets: "სოც. ქსელის პარამეტრები",
    },
    outputs: {
      title: "ისტორია",
      no_runs: "ჩანაწერები არ არის",
      select_job: "აირჩიეთ ჩანაწერი დეტალების სანახავად",
      status_label: "სტატუსი:",
      btn_download_zip: "ZIP გადმოწერა",
      untitled: "უსათაურო",
    },
    help: {
      title: "როგორ გამოვიყენოთ Lumina Vids",
      description: "შექმენით მაღალი ხარისხის სლაიდშოუ ვიდეოები ლოკალურად.",
      quick_start: "სწრაფი დაწყება",
      step_1: "გადადით 'გენერაციის' გვერდზე.",
      step_2: "ჩააგდეთ სურათები ატვირთვის ზონაში.",
      step_3: "შეიყვანეთ ქონების ID (გამოიყენება ფაილის სახელებისთვის).",
      step_4: "საჭიროების შემთხვევაში შეცვალეთ FPS, ხანგრძლივობა ან გადასვლა.",
      step_5: "დააჭირეთ '4 ვიდეოს გენერაციას'.",
      step_6: "დაელოდეთ პროცესის დასრულებას (ერთდროულად სრულდება მხოლოდ 1 სამუშაო).",
      step_7: "გადმოწერეთ ZIP ფაილი, რომელიც შეიცავს 4-ვე ვიდეო ფორმატს.",
      formats_title: "ფორმატები და შედეგები",
      formats_desc: "სისტემა ყოველ ჯერზე ქმნის 4 ვიდეოს:",
      troubleshooting: "პრობლემების მოგვარება",
      ts_ffmpeg: "FFmpeg ვერ მოიძებნა: დარწმუნდით, რომ FFmpeg დაინსტალირებულია და PATH-შია.",
      ts_python: "Python შეცდომები: შეამოწმეთ, რომ Python 3.x დაინსტალირებულია (moviepy, Pillow, numpy).",
      ts_stuck: "პროცესი გაჭედილია: თუ სამუშაო გაიჭედა, დააჭირეთ 'გაუქმებას' ან გადატვირთეთ სერვერი.",
    },
  },
  
  // რუსული / Russian / Русский
  ru: {
    nav: {
      brand: "Lumina Vids",
      generate: "Генерация",
      outputs: "Результаты",
      help: "Помощь",
    },
    generate: {
      input_images: "Загрузка изображений",
      drag_drop: "Перетащите изображения сюда",
      click_browse: "или нажмите для выбора",
      images_selected: "Выбрано {{count}} изображений",
      settings: "Настройки",
      property_id: "ID объекта",
      property_id_placeholder: "напр. p123",
      duration: "Длительность на изображение (сек)",
      fps: "FPS (кадров/сек)",
      transition: "Переход",
      transition_cut: "Срез (резкий)",
      transition_fade: "Fade (плавный)",
      transition_slide_left: "Сдвиг влево",
      transition_slide_right: "Сдвиг вправо",
      transition_slide_up: "Сдвиг вверх",
      transition_slide_down: "Сдвиг вниз",
      transition_zoom_in: "Приближение",
      transition_zoom_out: "Отдаление",
      transition_wipe_left: "Протирание влево",
      transition_wipe_right: "Протирание вправо",
      transition_wipe_up: "Протирание вверх",
      transition_wipe_down: "Протирание вниз",
      transition_pixelate: "Пикселизация",
      transition_ripple: "Рябь",
      transition_page_curl: "Завиток страницы",
      transition_circle_open: "Открытие кругом",
      transition_circle_close: "Закрытие кругом",
      transition_spin_in: "Вращение (вход)",
      transition_spin_out: "Вращение (выход)",
      transition_fly_in: "Прилет",
      transition_fly_out: "Улет",
      transition_duration: "Длительность перехода (сек)",
      auto_duration: "Авто длительность",
      music_label: "Фоновая музыка",
      music_volume: "Громкость",
      estimated_duration: "Предполагаемая длительность:",
      btn_generate: "Сгенерировать 4 видео",
      btn_cancel: "Отмена",
      btn_view_outputs: "Просмотр результатов",
      status_queued: "В очереди...",
      status_rendering: "Рендеринг...",
      status_success: "Готово!",
      status_error: "Ошибка. Проверьте настройки или изображения.",
      presets: "Пресеты соц. сетей",
    },
    outputs: {
      title: "История",
      no_runs: "Записей пока нет",
      select_job: "Выберите запись для просмотра деталей",
      status_label: "Статус:",
      btn_download_zip: "Скачать ZIP",
      untitled: "Без названия",
    },
    help: {
      title: "Как использовать Lumina Vids",
      description: "Создавайте высококачественные слайд-шоу видео локально.",
      quick_start: "Быстрый старт",
      step_1: "Перейдите на страницу 'Генерация'.",
      step_2: "Перетащите изображения в зону загрузки.",
      step_3: "Введите ID объекта (используется для имен файлов).",
      step_4: "При необходимости настройте FPS, длительность или переходы.",
      step_5: "Нажмите 'Сгенерировать 4 видео'.",
      step_6: "Дождитесь завершения процесса (одновременно выполняется только 1 задача).",
      step_7: "Скачайте ZIP-файл, содержащий все 4 видео формата.",
      formats_title: "Форматы и результаты",
      formats_desc: "Система каждый раз создает 4 видео:",
      troubleshooting: "Устранение неполадок",
      ts_ffmpeg: "FFmpeg не найден: Убедитесь, что FFmpeg установлен и добавлен в PATH.",
      ts_python: "Ошибки Python: Проверьте, что установлен Python 3.x (moviepy, Pillow, numpy).",
      ts_stuck: "Процесс завис: Одновременно выполняется только 1 задача. Если задача зависла, нажмите 'Отмена' или перезапустите сервер.",
    },
  },
};

// ენების ტიპი / Language type / Тип языка
export type Language = "en" | "ka" | "ru";
