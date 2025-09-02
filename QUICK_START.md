# 🚀 Quick Start Guide

Get your LPRT Property Management System up and running in minutes!

## ⚡ Super Quick Start (Windows)

1. **Double-click** `start-project.bat`
2. **Wait** for dependencies to install
3. **Open** http://localhost:5173 in your browser
4. **Done!** 🎉

## ⚡ Super Quick Start (Mac/Linux)

1. **Open terminal** in project directory
2. **Run**: `chmod +x start-project.sh && ./start-project.sh`
3. **Open** http://localhost:5173 in your browser
4. **Done!** 🎉

## 🔧 Manual Setup

### Prerequisites
- **Node.js** (v16+) - [Download here](https://nodejs.org/)
- **MongoDB** (v5+) - [Download here](https://www.mongodb.com/try/download/community)

### Step 1: Start MongoDB
```bash
# Windows
mongod

# Mac/Linux
sudo systemctl start mongod
```

### Step 2: Backend Setup
```bash
cd server
npm install
npm run dev
```

### Step 3: Frontend Setup
```bash
# In a new terminal
npm install
npm run dev
```

### Step 4: Access the App
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

## 🎯 First Steps

1. **Open** http://localhost:5173
2. **Select Role**: Choose "Property Owner" or "Tenant"
3. **Create Account**: Fill in your details
4. **Login**: Access your dashboard
5. **Explore**: Start using the system!

## 🆘 Common Issues

### Port Already in Use
```bash
# Kill process on port 5000
npx kill-port 5000

# Kill process on port 5173
npx kill-port 5173
```

### MongoDB Connection Error
- Ensure MongoDB is running
- Check if MongoDB is installed
- Verify connection string in `server/.env`

### Dependencies Installation Failed
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📱 Test Accounts

### Property Owner
- **Email**: owner@example.com
- **Password**: password123

### Tenant
- **Email**: tenant@example.com
- **Password**: password123

## 🔗 Useful Links

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health
- **Documentation**: README.md

## 🚀 Next Steps

1. **Read** the full README.md
2. **Explore** the API endpoints
3. **Customize** the system for your needs
4. **Deploy** to production

---

**Need help?** Check the main README.md or create an issue in the repository!
