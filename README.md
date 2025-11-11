## 📘 Blog API & Frontend – Full-Stack Django + React Project

### Overview
A full-stack blog platform built with **Django REST Framework (backend)** and **React + TypeScript (frontend)**.  
The system supports **user authentication, article management (CRUD), comments, and like functionality** — with full synchronization between server and client.

---

### 🔧 Tech Stack

#### **Backend (Django + DRF)**
- Django 5 & Django REST Framework  
- JWT Authentication (SimpleJWT)  
- PostgreSQL / SQLite (local dev)  
- Pagination, search & ordering  
- ModelViewSets with permissions and filtering  
- Annotated fields: `likes_count` and `user_liked`  
- REST endpoints for articles, comments, and likes  

#### **Frontend (React + TypeScript)**
- React 18 + Vite + TypeScript  
- React Router DOM v6  
- Context-based authentication (AuthContext)  
- Dynamic routing for `Articles`, `Details`, `Create`, `Edit`, and `Profile`  
- Secure fetch API layer with automatic token headers  
- Toast feedback for success/error  
- Clean and minimal responsive UI  

---

### ⚙️ Features
- **Register / Login / Logout** with JWT  
- **Article CRUD** – create, read, update, delete (authors only)  
- **Likes System** – toggle like/unlike per user  
- **Comments System** – add and view comments per article  
- **Search & Sort** – search by title/content, order by date or popularity  
- **Pagination** – server-side pages with navigation  
- **Auto Authentication Refresh** – load user info on startup  
- **Protected Routes** – authenticated views enforced via context  

---

### 📂 Project Structure
```bash
blogapi/
├── articles/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│
├── users/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│
├── blogapi/
│   ├── settings.py
│   ├── urls.py
│
└── manage.py

frontend/
├── src/
│   ├── pages/
│   │   ├── ArticlesListPage.tsx
│   │   ├── ArticleDetailsPage.tsx
│   │   ├── ArticleCreatePage.tsx
│   │   ├── ArticleEditPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── ProfilePage.tsx
│   ├── contexts/AuthContext.tsx
│   ├── services/api.ts
│   ├── services/endpoints.ts
│   ├── AppRoutes.tsx
│   └── main.tsx
```

---

### 🚀 How to Run Locally

#### **Backend**
```bash
# 1. Clone repository
git clone https://github.com/itai-gal/blogapi.git
cd blogapi

# 2. Setup virtual environment
python -m venv .venv
source .venv/bin/activate  # on Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run migrations
python manage.py migrate

# 5. Start server
python manage.py runserver
```
Server runs on: **http://127.0.0.1:8000/**

---

#### **Frontend**
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: **http://localhost:5173/**  
Make sure the API base URL in `endpoints.ts` matches your Django backend.

---

### 🧩 API Endpoints Overview
| Method | Endpoint | Description |
|--------|-----------|-------------|
| `POST` | `/api/auth/register/` | Register new user |
| `POST` | `/api/token/` | Obtain JWT access token |
| `GET`  | `/api/me/` | Current user info |
| `GET`  | `/api/articles/` | List articles |
| `POST` | `/api/articles/` | Create article |
| `GET`  | `/api/articles/{id}/` | Retrieve article |
| `PATCH`| `/api/articles/{id}/` | Update article |
| `DELETE`| `/api/articles/{id}/` | Delete article |
| `POST` | `/api/post-user-likes/` | Like an article |
| `DELETE`| `/api/post-user-likes/by-article/{id}/` | Unlike article |

---

### 📄 Future Improvements
- Add image upload for articles  
- Add comment threads & reply support  
- Implement user profiles with avatars  
- UI refinements and theming (dark mode)  
- Deploy to Vercel (frontend) + Render (backend)  

---

### 👤 Author
**Itai Gal**  
Full-Stack Developer (React + Django)  
📎 [LinkedIn](https://www.linkedin.com/in/itai-gal-894415361)  
💻 [GitHub](https://github.com/itai-gal)
