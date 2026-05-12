FROM php:8.2-cli-alpine

RUN apk add --no-cache \
    ffmpeg \
    freetype \
    freetype-dev \
    libjpeg-turbo \
    libjpeg-turbo-dev \
    libpng \
    libpng-dev \
    libzip-dev \
    oniguruma-dev \
    unzip \
    zip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
    bcmath \
    exif \
    gd \
    mbstring \
    opcache \
    pdo_mysql \
    zip \
    && apk del freetype-dev libjpeg-turbo-dev libpng-dev oniguruma-dev

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction --no-scripts

COPY backend/ .

RUN composer dump-autoload --no-dev --optimize --no-interaction --no-scripts

RUN mkdir -p \
    bootstrap/cache \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    storage/app/public \
    && chmod +x /app/start.sh

RUN printf "upload_max_filesize=2048M\npost_max_size=2050M\nmemory_limit=1024M\nmax_execution_time=0\nmax_input_time=-1\nmax_file_uploads=50\n" > /usr/local/etc/php/conf.d/uploads.ini

ENV APP_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["/app/start.sh"]
