# RailConnect - Railway Reservation System

RailConnect is a full-stack railway reservation system that allows users to search trains, book tickets, manage reservations, and view booking history. The project includes secure authentication, role-based access control, admin management features, and a MySQL-backed reservation workflow.

## Features

* Built a complete railway ticket booking system with user registration, login, train search, booking, cancellation, and booking history.
* Implemented JWT-based authentication with protected routes for secure user and admin access.
* Developed role-based authorization to separate passenger and admin functionalities.
* Designed admin features for managing trains, viewing bookings, and tracking reservation data.
* Integrated MySQL database with structured SQL schemas for users, trains, bookings, and railway operations.
* Created a responsive React frontend with protected routing, global state management, and clean UI components.
* Added centralized error handling and async middleware for cleaner backend API management.
* Included Postman collection for API testing and SQL scripts for database setup.

## Tech Stack

**Frontend:** React, Vite, React Router, Context API, CSS Modules
**Backend:** Node.js, Express.js, JWT, Middleware, REST APIs
**Database:** MySQL
**Tools:** Postman, Git, GitHub, VS Code

## Project Structure

```bash
Rail-Connect/
├── RailConnect-Backend/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── db.js
│   ├── app.js
│   ├── server.js
│   └── railway_system_full.sql
│
├── RailConnect-Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── GlobalContext.jsx
│   │   └── main.jsx
│   └── vite.config.js
```

## Getting Started

### Backend Setup

```bash
cd RailConnect-Backend
npm install
npm start
```

Create a `.env` file in the backend folder:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=railconnect
JWT_SECRET=your_secret_key
```

Import the SQL file into MySQL:

```bash
railway_system_full.sql
```

### Frontend Setup

```bash
cd RailConnect-Frontend
npm install
npm run dev
```

Create a `.env` file in the frontend folder:

```env
VITE_BACKEND_URL=http://localhost:5000
```

## API Testing

A Postman collection is included in the backend folder for testing authentication, train, booking, user, and admin APIs.

## Future Enhancements

* PNR status tracking
* PDF ticket generation
* Online payment integration
* Email ticket confirmation
* Real-time seat availability
* Admin analytics dashboard

## Author

**Md Yahiya Ariz**
GitHub: [mdyahiyaariz](https://github.com/mdyahiyaariz)
