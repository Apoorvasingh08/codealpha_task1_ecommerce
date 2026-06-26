# 🛒 E-Commerce Website — CodeAlpha Task 1

A full-stack e-commerce web application built as part of the **CodeAlpha Web Development Internship**.

---

## 📁 Project Structure
codealpha_task1_ecommerce/

├── backend/           # Node.js/Express backend (API, routes, database)

└── task1-ecommerce/   # React frontend (UI, components, pages)

---

## ✨ Features

- 🏠 Home page with product listings
- 🛍️ Product detail pages
- 🛒 Add to cart functionality
- 🔐 User authentication (Login / Register)
- 📦 Order management
- 💳 Checkout flow
- 📱 Responsive design

---

## 🛠️ Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Frontend  | React.js, CSS           |
| Backend   | Node.js, Express.js     |
| Database  | MongoDB                 |
| Auth      | JWT (JSON Web Tokens)   |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB (local or Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/Apoorvasingh08/codealpha_task1_ecommerce.git
cd codealpha_task1_ecommerce
```

### 2. Setup the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the backend server:

```bash
npm start
```

### 3. Setup the Frontend

```bash
cd ../task1-ecommerce
npm install
npm start
```

The app will run at `http://localhost:3000`
---

## 🤝 Acknowledgements

- Built as **Task 1** of the [CodeAlpha](https://www.codealpha.tech/) Full stack Development Internship
- Developed by **Apoorva Singh**

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
