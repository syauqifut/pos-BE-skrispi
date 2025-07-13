# POS Backend - Authentication System

A robust Point of Sales backend system built with Express.js, TypeScript, and PostgreSQL featuring JWT-based authentication.
<br />fork from https://github.com/syauqifut/pos-BE with custom modul based on client

## 🏗️ Architecture

```
src/
├── app.ts                     # Express app entry point
├── db/
│   └── index.ts              # PostgreSQL connection
├── exceptions/
│   ├── HttpException.ts      # Custom error class
│   └── errorHandler.ts       # Global error handling
├── middlewares/
│   └── auth.middleware.ts    # JWT authentication
├── modules/
│   └── auth/
│       ├── auth.routes.ts    # Route definitions
│       ├── auth.controller.ts# Request/response handling
│       ├── auth.service.ts   # Business logic
│       └── auth.sql.ts       # SQL queries
├── routes.ts                 # Route combiner
└── utils/
    └── helpers.ts            # Utility functions
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your database credentials:
   ```env
   PORT=3000
   NODE_ENV=development
   
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=pos_db
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=24h
   ```

3. **Set up database:**
   ```bash
   # Create database and run the SQL script
   psql -U postgres -c "CREATE DATABASE pos_db;"
   psql -U postgres -d pos_db -f database.sql
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## 📡 API Endpoints

### Authentication

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "admin"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "name": "Administrator",
    "role": "admin"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid username or password"
}
```

#### GET /api/auth/verify
Verify JWT token validity.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "userId": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

#### POST /api/auth/logout
Logout user (client-side token removal).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful. Please remove the token from client storage."
}
```

### Health Check

#### GET /api/health
Check API health status.

**Response (200):**
```json
{
  "success": true,
  "message": "POS Backend API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

## 🛠️ Development

### Scripts

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Development with nodemon
npm run dev:watch
```

### Project Structure

- **Modular Architecture**: Each feature (auth) has its own module
- **Layered Design**: Routes → Controllers → Services → Database
- **Type Safety**: Full TypeScript support with strict mode
- **Error Handling**: Centralized error handling with custom exceptions
- **Security**: JWT authentication with bcrypt password hashing

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterized queries
- **Error Handling**: No sensitive data in error responses

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'cashier',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 🧪 Testing

Test the login endpoint with curl:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'

# Verify token (replace <token> with actual token)
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer <token>"
```

## 📦 Technologies

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **pg** - PostgreSQL client
- **dotenv** - Environment variables
- **cors** - Cross-origin requests

## 🔄 Next Steps

To extend this system, consider adding:

- User registration endpoint
- Password reset functionality
- Refresh token mechanism
- Rate limiting
- API versioning
- Unit and integration tests
- Docker containerization
- API documentation with Swagger

## 📄 License

MIT License 