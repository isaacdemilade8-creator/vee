# 📷 Vee — Full-Stack Social Media MVP

A production-ready Social app built with:
- **Backend**: Laravel 11 + Sanctum API
- **Frontend**: React Native (Expo)
- **Database**: MySQL 8

---

## 🗂️ Folder Structure

\`\`\`
instagramtech/
├── backend/                        # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/   # AuthController, PostController, etc.
│   │   │   ├── Requests/          # Form validation classes
│   │   │   └── Resources/         # API response transformers
│   │   ├── Models/                # User, Post, Like, Comment, Follow
│   │   └── Notifications/         # LikedPost, Comment, NewFollower
│   ├── database/
│   │   ├── migrations/            # All table schemas
│   │   └── seeders/               # Sample data
│   └── routes/
│       └── api.php                # All API route definitions
│
└── frontend/                       # React Native (Expo)
    ├── App.js                      # Root component
    └── src/
        ├── api/
        │   ├── client.js           # Axios instance + SecureStore token
        │   └── services.js         # AuthAPI, PostAPI, UserAPI, etc.
        ├── context/
        │   └── AuthContext.js      # Global auth state
        ├── hooks/
        │   └── useApi.js           # useApi + usePaginatedApi hooks
        ├── navigation/
        │   └── AppNavigator.js     # Stack + Tab navigators
        ├── screens/
        │   ├── auth/
        │   │   ├── LoginScreen.js
        │   │   └── RegisterScreen.js
        │   └── main/
        │       ├── HomeScreen.js        # Feed
        │       ├── CreatePostScreen.js  # Image upload
        │       ├── ProfileScreen.js     # Own profile
        │       ├── UserProfileScreen.js # Other users
        │       ├── CommentsScreen.js    # Post comments
        │       ├── SearchScreen.js      # User search
        │       └── NotificationsScreen.js
        ├── components/
        │   ├── common/Avatar.js
        │   └── post/PostCard.js
        └── utils/
            ├── theme.js            # Colors, typography, spacing
            └── dateUtils.js        # Relative time formatting
\`\`\`

---

## 🚀 Backend Setup (Laravel)

### 1. Prerequisites

\`\`\`bash
php --version    # >= 8.2
mysql --version  # >= 8.0
composer --version
\`\`\`

### 2. Install dependencies

\`\`\`bash
cd backend
composer install
\`\`\`

### 3. Configure environment

\`\`\`bash
cp .env.example .env
php artisan key:generate
\`\`\`

Edit \`.env\`:
\`\`\`env
DB_DATABASE=instagramtech
DB_USERNAME=root
DB_PASSWORD=your_password
APP_URL=http://localhost:8000
\`\`\`

### 4. Create the database

\`\`\`bash
mysql -u root -p -e "CREATE DATABASE instagramtech CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
\`\`\`

### 5. Run migrations and seed

\`\`\`bash
php artisan migrate
php artisan db:seed
\`\`\`

### 6. Create storage symlink (for serving uploaded images)

\`\`\`bash
php artisan storage:link
\`\`\`

### 7. Start the server

\`\`\`bash
php artisan serve --host=0.0.0.0 --port=8000
\`\`\`

> The API is now available at `http://YOUR_LAN_IP:8000/api`

---

## 📱 Frontend Setup (React Native / Expo)

### 1. Prerequisites

\`\`\`bash
node --version    # >= 18
npm --version
npx expo --version
\`\`\`

### 2. Install dependencies

\`\`\`bash
cd frontend
npm install
\`\`\`

### 3. Configure API base URL

Edit \`src/api/client.js\` — set your machine's LAN IP:

\`\`\`js
const BASE_URL = __DEV__
  ? 'http://192.168.1.100:8000/api'  // ← Your machine's LAN IP
  : 'https://api.yourproductiondomain.com/api';
\`\`\`

> **Find your LAN IP:**
> - macOS/Linux: \`ifconfig | grep inet\`
> - Windows: \`ipconfig\`
> - Must use LAN IP (not localhost) for physical devices

### 4. Start Expo

\`\`\`bash
npx expo start
\`\`\`

Scan the QR code with **Expo Go** app on your phone, or press:
- `a` → Android emulator
- `i` → iOS simulator

---

## 🌐 API Route Reference

### Authentication
| Method | Endpoint                   | Description            | Auth |
|--------|----------------------------|------------------------|------|
| POST   | /api/auth/register         | Register account       | No   |
| POST   | /api/auth/login            | Login + get token      | No   |
| POST   | /api/auth/logout           | Revoke token           | Yes  |
| GET    | /api/auth/me               | Get current user       | Yes  |

### Profile
| Method | Endpoint                        | Description          | Auth |
|--------|---------------------------------|----------------------|------|
| GET    | /api/profile                    | Own profile          | Yes  |
| POST   | /api/profile                    | Update profile       | Yes  |
| GET    | /api/users/{username}           | View user profile    | Yes  |
| GET    | /api/users/{username}/posts     | User's posts grid    | Yes  |
| GET    | /api/users/search?q={query}     | Search users         | Yes  |

### Posts
| Method | Endpoint                   | Description          | Auth |
|--------|----------------------------|----------------------|------|
| GET    | /api/posts/feed            | Personalized feed    | Yes  |
| GET    | /api/posts                 | All posts (explore)  | Yes  |
| POST   | /api/posts                 | Create post          | Yes  |
| GET    | /api/posts/{id}            | Single post          | Yes  |
| DELETE | /api/posts/{id}            | Delete post (owner)  | Yes  |

### Likes
| Method | Endpoint                   | Description          | Auth |
|--------|----------------------------|----------------------|------|
| POST   | /api/posts/{id}/like       | Toggle like/unlike   | Yes  |
| GET    | /api/posts/{id}/likes      | List likers          | Yes  |

### Comments
| Method | Endpoint                              | Description         | Auth |
|--------|---------------------------------------|---------------------|------|
| GET    | /api/posts/{id}/comments              | List comments       | Yes  |
| POST   | /api/posts/{id}/comments              | Add comment         | Yes  |
| DELETE | /api/posts/{id}/comments/{commentId}  | Delete comment      | Yes  |

### Follow System
| Method | Endpoint                          | Description       | Auth |
|--------|-----------------------------------|-------------------|------|
| POST   | /api/users/{username}/follow      | Follow/Unfollow   | Yes  |
| GET    | /api/users/{username}/followers   | Followers list    | Yes  |
| GET    | /api/users/{username}/following   | Following list    | Yes  |

### Notifications
| Method | Endpoint                        | Description          | Auth |
|--------|---------------------------------|----------------------|------|
| GET    | /api/notifications              | All notifications    | Yes  |
| POST   | /api/notifications/read-all     | Mark all read        | Yes  |
| POST   | /api/notifications/{id}/read    | Mark one read        | Yes  |

---

## 🔑 Example API Requests (curl)

### Register
\`\`\`bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","email":"john@example.com","password":"password123","password_confirmation":"password123","full_name":"John Doe"}'
\`\`\`

### Login
\`\`\`bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
# Returns: { "token": "1|abc123..." }
\`\`\`

### Get Feed (authenticated)
\`\`\`bash
curl http://localhost:8000/api/posts/feed \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
\`\`\`

### Create Post (with image)
\`\`\`bash
curl -X POST http://localhost:8000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "image=@/path/to/photo.jpg" \
  -F "caption=My first post! #hello"
\`\`\`

### Like a Post
\`\`\`bash
curl -X POST http://localhost:8000/api/posts/1/like \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
\`\`\`

### Follow a User
\`\`\`bash
curl -X POST http://localhost:8000/api/users/alice/follow \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
\`\`\`

### Add Comment
\`\`\`bash
curl -X POST http://localhost:8000/api/posts/1/comments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"body":"Great photo!"}'
\`\`\`

---

## 🔒 Security Notes

- Tokens stored with **Expo SecureStore** (encrypted on device)
- All image uploads validated: MIME type, max 5MB
- Post deletion enforced server-side (403 if not owner)
- Comment deletion allowed for comment author OR post owner
- Username regex prevents special characters
- Passwords hashed with bcrypt (rounds=12)
- HTTPS enforced in production via AppServiceProvider

---

## 🧪 Seeded Test Accounts

After running `php artisan db:seed`:

| Username | Email               | Password  |
|----------|---------------------|-----------|
| alice    | alice@example.com   | password  |
| bob      | bob@example.com     | password  |
| carol    | carol@example.com   | password  |

---

## 🛠 Production Checklist

- [ ] Set `APP_ENV=production` and `APP_DEBUG=false`
- [ ] Run `php artisan optimize` for caching
- [ ] Set up a queue worker for notifications: `php artisan queue:work`
- [ ] Configure a proper mail driver for production emails
- [ ] Set up HTTPS/SSL on your server
- [ ] Update `BASE_URL` in `src/api/client.js` to production URL
- [ ] Set `SANCTUM_STATEFUL_DOMAINS` in `.env`
