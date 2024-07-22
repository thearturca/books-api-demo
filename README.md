# Демо books-api

## Использованные технологии

- Typescript
- Koa
- Kysely + Postgres
- PostgreSQL
- JWT
- Nodemailer
- zod
- dotenv-run
- Docker

## Конфигурация
Конфигурация производится с помощью переменных окружений.
Используется библиотека `dotenv-run` для парсинга `.env` файла.

[Пример файла конфигурации](.env.example)


## Запуск

### 1. Генерация ключей для JWT

Linux:
```sh
sh generate-keys.sh
```

Windows:
```sh
generate-keys.ps1
```

### Запуск
Запуск через Docker
```sh
docker-compose up --build
```

Запуск локально в режиме разработки

1. Установка зависимостей
```sh
pnpm i --frozen-lockfile
```


2. Запуск
```sh
pnpm run start:dev
```

## Методы

1. Добавление книги
- HTTP метод: POST
- Эндпоинт: /books
- Тело запроса: JSON с полями title, author, publicationDate, genres
- Ответ: JSON с данными добавленной книги
- Требует аутентификации (только для пользователей с ролью "администратор")

2. Получение списка книг
- HTTP метод: GET
- Эндпоинт: /books
- Ответ: JSON массив с данными всех книг

3. Получение книги по ID
- HTTP метод: GET
- Эндпоинт: /books/:id
- Ответ: JSON с данными книги

4. Обновление информации о книге
- HTTP метод: PUT
- Эндпоинт: /books/:id
- Тело запроса: JSON с полями title, author, publicationDate, genres
- Ответ: JSON с данными обновленной книги
- Требует аутентификации (только для пользователей с ролью "администратор")

5. Удаление книги
- HTTP метод: DELETE
- Эндпоинт: /books/:id
- Требует аутентификации (только для пользователей с ролью "администратор")

6. Регистрация пользователя
- HTTP метод: POST
- Эндпоинт: /users/register
- Тело запроса: JSON с полями username, password, email
- Подтверждение email через письмо
- Ответ: JSON с данными зарегистрированного пользователя

7. Аутентификация пользователя
- HTTP метод: POST
- Эндпоинт: /users/login
- Тело запроса: JSON с полями username, password
- Ответ: JSON с токеном JWT

8. Получение информации о текущем пользователе
- HTTP метод: GET
- Эндпоинт: /users/me
- Ответ: JSON с данными текущего пользователя
- Требует аутентификации

9. Изменение роли пользователя
- HTTP метод: PUT
- Эндпоинт: /users/:id/role
- Тело запроса: JSON с полем role (используйте битовые маски для ролей)
- Ответ: JSON с данными обновленного пользователя
- Требует аутентификации (только для пользователей с ролью "администратор")

10. Выход из системы
- HTTP метод: POST
- Эндпоинт: /users/logout
- Ответ: Статус 204
- Требует аутентификации

11. Рефреш токена
- HTTP метод: POST
- Эндпоинт: /users/refresh
- Ответ: JSON с токеном JWT
- Требует аутентификации

12. Подтверждение email
- HTTP метод: POST
- Эндпоинт: /users/verify
- Тело запроса: JSON с полем code
- Ответ: JSON с данными текущего пользователя
- Требует аутентификации
