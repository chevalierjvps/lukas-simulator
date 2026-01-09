# 🔐 VipSim Authentication & User Management System

## Overview

VipSim now includes a complete authentication and user management system with role-based access control, session tracking, and comprehensive analytics.

---

## ⚡ Quick Start (3 Steps)

### 1️⃣ Create Environment File

**On macOS/Linux:**
```bash
./SETUP_ENV.sh
```

**On Windows:**
```bash
SETUP_ENV.bat
```

**Or manually:**
```bash
cd server
echo "JWT_SECRET=your-random-secret-here" > .env
echo "JWT_EXPIRY=24h" >> .env
echo "PORT=3000" >> .env
```

### 2️⃣ Start the Application

```bash
npm run dev
```

### 3️⃣ Create Admin Account

1. Open browser to `http://localhost:5173`
2. Click "Create Account"
3. **First user automatically becomes admin** 🎉

---

## 🎯 What's New

### ✨ Features Implemented

#### 🔐 Authentication System
- JWT-based secure authentication
- Bcrypt password hashing
- 24-hour token expiration
- Automatic login persistence

#### 👥 User Management (Admin)
- Create/delete users
- Promote/demote roles
- View all registered users
- Manage permissions

#### 📊 Session Tracking & Analytics
- All conversations automatically logged
- View session history
- Full chat log replay
- Duration tracking
- Case-based filtering

#### 🎭 Role-Based Access Control
**Admin Users:**
- ✅ Create, edit, delete cases
- ✅ Manage all users
- ✅ View all sessions
- ✅ Full platform access

**Regular Users:**
- ✅ Practice with cases
- ✅ View own session history
- ✅ Track personal progress
- ❌ Cannot edit cases
- ❌ Cannot manage users

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **IMPLEMENTATION_SUMMARY.md** | Complete technical overview of all changes |
| **AUTH_SETUP.md** | Detailed setup guide and API documentation |
| **ARCHITECTURAL_GUIDE.md** | Original system architecture (now updated) |
| **README_AUTHENTICATION.md** | This file - quick reference |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────┐
│         Frontend (React + Vite)          │
│  ┌────────────────────────────────────┐  │
│  │  AuthContext (Global Auth State)   │  │
│  │  • Login/Register Pages            │  │
│  │  • Token Management                │  │
│  │  • Protected Routes                │  │
│  └────────────────────────────────────┘  │
└───────────────┬──────────────────────────┘
                │ JWT Token
┌───────────────┴──────────────────────────┐
│      Backend (Express + Node.js)         │
│  ┌────────────────────────────────────┐  │
│  │  Authentication Middleware         │  │
│  │  • Token Verification              │  │
│  │  • Role Checking                   │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  Protected API Routes              │  │
│  │  • /api/auth/*   - Auth endpoints  │  │
│  │  • /api/cases/*  - Case management │  │
│  │  • /api/users/*  - User management │  │
│  │  • /api/analytics/* - Analytics    │  │
│  └────────────────────────────────────┘  │
└───────────────┬──────────────────────────┘
                │
┌───────────────┴──────────────────────────┐
│        Database (SQLite)                 │
│  • users         - Authentication        │
│  • cases         - Clinical scenarios    │
│  • sessions      - Practice sessions     │
│  • interactions  - Chat logs             │
└──────────────────────────────────────────┘
```

---

## 🔑 Key Files Modified/Created

### New Files
```
server/middleware/auth.js         - JWT authentication middleware
src/contexts/AuthContext.jsx      - Global auth state
src/services/authService.js       - Auth API calls
src/components/auth/LoginPage.jsx - Login UI
src/components/auth/RegisterPage.jsx - Register UI
AUTH_SETUP.md                     - Detailed documentation
IMPLEMENTATION_SUMMARY.md         - Complete changes list
SETUP_ENV.sh                      - Setup script (Unix)
SETUP_ENV.bat                     - Setup script (Windows)
```

### Modified Files
```
server/db.js                      - Added users table
server/routes.js                  - Auth endpoints + protected routes
src/App.jsx                       - Auth-protected routing
src/components/chat/ChatInterface.jsx - User-linked sessions
src/components/settings/ConfigPanel.jsx - Role-based tabs
src/services/llmService.js        - Auth headers
```

---

## 🧪 Testing Checklist

### ✅ Admin Features
- [ ] Create new case
- [ ] Edit existing case
- [ ] Delete case
- [ ] View all users
- [ ] Promote user to admin
- [ ] Delete user
- [ ] View all sessions

### ✅ User Features
- [ ] Register new account
- [ ] Login with credentials
- [ ] Load and practice case
- [ ] View own session history
- [ ] View chat logs
- [ ] Cannot create cases (should fail)

### ✅ Security
- [ ] Cannot access admin routes as user
- [ ] Token expires after 24 hours
- [ ] Passwords are hashed (check database)
- [ ] Users only see their own sessions

---

## 🔒 Security Features

| Feature | Implementation |
|---------|----------------|
| **Password Security** | Bcrypt with salt rounds = 10 |
| **Token Security** | JWT signed with secret key |
| **Token Expiry** | 24 hours (configurable) |
| **Role-Based Access** | Middleware enforcement |
| **Session Isolation** | Users only see own data |
| **Input Validation** | Server-side validation |

---

## 🚨 Troubleshooting

### "Cannot find module 'bcrypt'" or similar
```bash
npm install
```

### "Invalid token" or "Token expired"
- Tokens expire after 24 hours
- Solution: Log out and log back in

### "Access denied" on admin routes
- Your user role is not admin
- First registered user is admin
- Admins can promote other users

### .env file not found
- Run `./SETUP_ENV.sh` (Unix) or `SETUP_ENV.bat` (Windows)
- Or create manually in `server/` directory

### Cannot create cases
- Only admins can create cases
- Check your role in User Management

### First user not becoming admin
- Delete `server/database.sqlite`
- Restart server
- Register again (will be admin)

---

## 📊 API Endpoints Reference

### Authentication
```
POST /api/auth/register    - Register new user
POST /api/auth/login       - Login (returns JWT)
GET  /api/auth/verify      - Verify token
GET  /api/auth/profile     - Get user profile
```

### Cases (Protected)
```
GET    /api/cases          - List all (authenticated)
POST   /api/cases          - Create (admin only)
PUT    /api/cases/:id      - Update (admin only)
DELETE /api/cases/:id      - Delete (admin only)
```

### Users (Admin Only)
```
GET    /api/users          - List all users
GET    /api/users/:id      - Get user details
PUT    /api/users/:id      - Update user
DELETE /api/users/:id      - Delete user
```

### Analytics (Role-based)
```
GET /api/analytics/sessions           - All (admin) or own (user)
GET /api/analytics/sessions/:id       - Session with chat log
GET /api/analytics/user-stats/:userId - User statistics
```

---

## 💡 Usage Examples

### Frontend: Using Auth Context
```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
    const { user, isAdmin, logout } = useAuth();
    
    return (
        <div>
            <p>Welcome {user?.username}</p>
            {isAdmin() && <AdminPanel />}
            <button onClick={logout}>Logout</button>
        </div>
    );
}
```

### Frontend: Making Authenticated API Calls
```javascript
import { AuthService } from '../services/authService';

const token = AuthService.getToken();
const response = await fetch('/api/endpoint', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});
```

### Backend: Creating Protected Route
```javascript
import { authenticateToken, requireAdmin } from './middleware/auth.js';

// Any authenticated user
router.get('/api/data', authenticateToken, (req, res) => {
    const userId = req.user.id; // Available from token
    // ...
});

// Admin only
router.post('/api/admin', authenticateToken, requireAdmin, (req, res) => {
    // Only admins reach here
    // ...
});
```

---

## 🎓 Database Schema

### users
```sql
id            INTEGER PRIMARY KEY
username      TEXT UNIQUE NOT NULL
email         TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
role          TEXT ('admin' or 'user')
created_at    DATETIME
```

### sessions (updated)
```sql
id            INTEGER PRIMARY KEY
case_id       INTEGER
user_id       INTEGER  -- NEW: Links to users
student_name  TEXT
start_time    DATETIME
end_time      DATETIME -- NEW: Session end
duration      INTEGER  -- NEW: Duration in seconds
```

### interactions (existing)
```sql
id            INTEGER PRIMARY KEY
session_id    INTEGER
role          TEXT ('user', 'assistant', 'system')
content       TEXT
timestamp     DATETIME
```

---

## 🚀 Production Deployment Checklist

Before deploying to production:

- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Use HTTPS for all connections
- [ ] Set secure JWT_EXPIRY (consider shorter)
- [ ] Enable rate limiting on auth endpoints
- [ ] Add password strength requirements
- [ ] Implement password reset flow
- [ ] Add email verification
- [ ] Set up database backups
- [ ] Enable audit logging
- [ ] Add CORS restrictions
- [ ] Use environment-specific configs

---

## 📞 Support

For issues or questions:
1. Check `IMPLEMENTATION_SUMMARY.md` for technical details
2. Read `AUTH_SETUP.md` for setup and development guide
3. Review `ARCHITECTURAL_GUIDE.md` for system architecture

---

## ✅ Verification

To verify the implementation is complete:

```bash
# Check all new files exist
ls -la server/middleware/auth.js
ls -la src/contexts/AuthContext.jsx
ls -la src/components/auth/LoginPage.jsx
ls -la src/components/auth/RegisterPage.jsx

# Check dependencies installed
npm list bcrypt jsonwebtoken dotenv

# Check .env exists
ls -la server/.env

# Start and test
npm run dev
```

---

## 🎉 You're All Set!

The authentication system is fully implemented and ready to use. Enjoy your secure VipSim platform!

**Remember:** The first user you create will automatically become an admin. 🔑
