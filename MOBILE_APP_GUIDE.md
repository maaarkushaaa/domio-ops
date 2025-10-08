# 📱 Пошаговая инструкция: Создание мобильного приложения DOMIO Ops

## 🎯 Что вы получите
После выполнения этих шагов у вас будет полноценное нативное мобильное приложение для iOS и Android, которое работает на реальных устройствах и в эмуляторах.

---

## 📋 Подготовка (5 минут)

### Шаг 1: Установка необходимых программ

#### Для разработки на Android:
1. **Установите Node.js** (если еще не установлен)
   - Скачайте с [nodejs.org](https://nodejs.org/)
   - Выберите LTS версию (рекомендуется)
   - Установите с настройками по умолчанию

2. **Установите Android Studio**
   - Скачайте с [developer.android.com](https://developer.android.com/studio)
   - Запустите установщик
   - При установке выберите "Standard" setup
   - Дождитесь загрузки всех компонентов SDK

3. **Настройте переменные окружения** (Windows):
   ```
   ANDROID_HOME = C:\Users\ВашеИмя\AppData\Local\Android\Sdk
   ```
   Добавьте в PATH:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   ```

#### Для разработки на iOS (только macOS):
1. **Установите Xcode**
   - Откройте App Store
   - Найдите "Xcode"
   - Нажмите "Установить" (это займет время, ~12 GB)

2. **Установите Command Line Tools**
   ```bash
   xcode-select --install
   ```

3. **Установите CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

---

## 🚀 Основные шаги (15 минут)

### Шаг 2: Экспорт проекта из Lovable

1. **Откройте ваш проект в Lovable**
2. **Нажмите кнопку "Export to GitHub"** (в правом верхнем углу)
3. **Подключите GitHub аккаунт** (если еще не подключен)
4. **Создайте новый репозиторий**
   - Имя: `domio-ops-mobile`
   - Сделайте его приватным для безопасности
5. **Дождитесь завершения экспорта**

### Шаг 3: Клонирование проекта на компьютер

1. **Откройте терминал** (Terminal на Mac, CMD или PowerShell на Windows)

2. **Перейдите в папку для проектов**
   ```bash
   cd ~/Documents  # или любая другая папка
   ```

3. **Клонируйте репозиторий**
   ```bash
   git clone https://github.com/ваш-username/domio-ops-mobile.git
   cd domio-ops-mobile
   ```

### Шаг 4: Установка зависимостей

```bash
npm install
```

⏱️ Это займет 2-3 минуты. Дождитесь завершения.

### Шаг 5: Добавление платформ

#### Для Android:
```bash
npx cap add android
```

#### Для iOS (только на Mac):
```bash
npx cap add ios
cd ios/App
pod install
cd ../..
```

### Шаг 6: Сборка веб-приложения

```bash
npm run build
```

### Шаг 7: Синхронизация с нативными платформами

```bash
npx cap sync
```

---

## 📱 Запуск приложения

### Вариант A: На эмуляторе Android

1. **Откройте Android Studio**
2. **Запустите эмулятор**:
   - Tools → Device Manager
   - Нажмите "Create Device"
   - Выберите "Pixel 5" или любой другой
   - Скачайте System Image (например, Android 13)
   - Нажмите "Finish"
   - Запустите эмулятор кнопкой ▶️

3. **Запустите приложение**:
   ```bash
   npx cap run android
   ```
   
   Или откройте проект в Android Studio:
   ```bash
   npx cap open android
   ```
   И нажмите зеленую кнопку ▶️ "Run"

### Вариант B: На реальном Android устройстве

1. **Включите режим разработчика** на телефоне:
   - Настройки → О телефоне
   - Нажмите 7 раз на "Номер сборки"
   
2. **Включите отладку по USB**:
   - Настройки → Для разработчиков
   - Включите "Отладка по USB"

3. **Подключите телефон к компьютеру** через USB

4. **Проверьте подключение**:
   ```bash
   adb devices
   ```
   Вы должны увидеть ваше устройство в списке

5. **Запустите приложение**:
   ```bash
   npx cap run android
   ```

### Вариант C: На эмуляторе iOS (только Mac)

1. **Откройте Xcode**:
   ```bash
   npx cap open ios
   ```

2. **Выберите эмулятор** в верхней панели:
   - Нажмите на выбор устройства
   - Выберите "iPhone 14" или любой другой

3. **Запустите приложение**:
   - Нажмите кнопку ▶️ (Play) или Cmd+R

### Вариант D: На реальном iPhone (только Mac)

1. **Подключите iPhone к Mac** через кабель

2. **Откройте Xcode**:
   ```bash
   npx cap open ios
   ```

3. **Настройте подпись**:
   - Выберите проект в навигаторе слева
   - Перейдите на вкладку "Signing & Capabilities"
   - Выберите вашу команду в "Team"
   - Если нет команды, нажмите "Add Account" и войдите с Apple ID

4. **Выберите ваш iPhone** в списке устройств

5. **Запустите приложение**: нажмите ▶️

6. **На iPhone**:
   - Настройки → Основные → VPN и управление устройством
   - Найдите ваш профиль разработчика
   - Нажмите "Доверять"

---

## 🔄 Процесс разработки

### Внесение изменений

1. **Вносите изменения в Lovable** (рекомендуется)
   - Используйте AI ассистента
   - Изменения сразу видны в браузере

2. **Экспортируйте изменения в GitHub**
   - Нажмите "Export to GitHub"

3. **На компьютере обновите код**:
   ```bash
   git pull origin main
   ```

4. **Пересоберите и синхронизируйте**:
   ```bash
   npm run build
   npx cap sync
   ```

5. **Перезапустите приложение**

### Быстрая разработка с hot-reload

Приложение уже настроено для hot-reload! Оно автоматически подключается к:
```
https://99b9f441-86fd-4cc2-8b30-dfcb3d0b55eb.lovableproject.com
```

Это означает, что изменения в Lovable будут видны в мобильном приложении без пересборки!

---

## 🐛 Решение проблем

### Android Studio не видит эмулятор
```bash
# Перезапустите adb
adb kill-server
adb start-server
```

### Ошибка "SDK not found" на Android
1. Откройте Android Studio
2. Tools → SDK Manager
3. Установите последний Android SDK
4. Перезапустите терминал

### Ошибка "Pod install failed" на iOS
```bash
cd ios/App
pod deintegrate
pod install
cd ../..
```

### Приложение не запускается
1. Очистите кеш:
   ```bash
   npm run build
   npx cap sync
   ```

2. Переустановите node_modules:
   ```bash
   rm -rf node_modules
   npm install
   ```

---

## 📦 Публикация приложения

### Google Play Store (Android)

1. **Создайте аккаунт разработчика**
   - Стоимость: $25 (один раз)
   - [play.google.com/console](https://play.google.com/console)

2. **Соберите production версию**:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

3. **Создайте signing key** (следуйте [инструкции Android](https://developer.android.com/studio/publish/app-signing))

4. **Загрузите в Play Console**

### App Store (iOS)

1. **Создайте аккаунт Apple Developer**
   - Стоимость: $99/год
   - [developer.apple.com](https://developer.apple.com)

2. **Создайте App ID** в developer console

3. **Archive в Xcode**:
   - Product → Archive
   - Distribute App

4. **Загрузите в App Store Connect**

---

## 📚 Дополнительные ресурсы

### Документация
- [Capacitor документация](https://capacitorjs.com/docs)
- [Lovable документация](https://docs.lovable.dev)
- [React документация](https://react.dev)

### Полезные команды

```bash
# Обновить все платформы
npx cap sync

# Открыть Android Studio
npx cap open android

# Открыть Xcode
npx cap open ios

# Проверить версию Capacitor
npx cap --version

# Обновить Capacitor
npm install @capacitor/core @capacitor/cli --save
npx cap sync
```

---

## ✅ Чеклист готовности

- [ ] Node.js установлен
- [ ] Android Studio установлен (для Android)
- [ ] Xcode установлен (для iOS, только Mac)
- [ ] Проект клонирован из GitHub
- [ ] `npm install` выполнен успешно
- [ ] Платформы добавлены (`npx cap add`)
- [ ] Проект собран (`npm run build`)
- [ ] Синхронизация выполнена (`npx cap sync`)
- [ ] Приложение запускается на эмуляторе
- [ ] Приложение запускается на реальном устройстве

---

## 🎉 Поздравляем!

Теперь у вас есть полноценное мобильное приложение DOMIO Ops! 

### Что дальше?
1. Добавьте push-уведомления
2. Настройте офлайн режим
3. Добавьте биометрическую аутентификацию
4. Оптимизируйте производительность

**Нужна помощь?** Обращайтесь к документации или в поддержку Lovable!
