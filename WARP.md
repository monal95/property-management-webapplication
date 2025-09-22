# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

LPRT (Landlord Property Rental Tool) is a full-stack property management system with separate interfaces for property owners and tenants. The application consists of a React frontend with Vite, a Node.js/Express backend, and MongoDB for data persistence.

## Development Commands

### Quick Start
- **Windows**: `./start-project.bat` - Installs dependencies and starts both servers
- **Mac/Linux**: `./start-project.sh` - Installs dependencies and starts both servers

### Frontend Commands (from root directory)
- `npm run dev` - Start Vite development server on http://localhost:5173
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint for code quality
- `npm run preview` - Preview production build locally

### Backend Commands (from Backend/ directory)
- `npm run dev` - Start development server with nodemon on http://localhost:5000
- `npm start` - Start production server
- `npm test` - Run Jest tests

### Single Test Execution
- **Backend**: `cd Backend && npm test -- --testNamePattern="test_name"`
- **Frontend**: No test suite configured

## Architecture Overview

### Core Structure
The application follows a modular monorepo structure with clear separation between frontend and backend:

```
LPRT_WEB/
├── frontend/          # React + Vite application
│   └── src/
│       ├── components/    # React components organized by user role
│       │   ├── Auth/     # Authentication flow components
│       │   ├── owner/    # Property owner dashboard components
│       │   └── tenants/  # Tenant dashboard components
│       └── api.js        # Centralized API communication
├── Backend/           # Node.js Express server
│   ├── models/       # Mongoose schemas for MongoDB
│   ├── routes/       # Express route handlers by feature
│   ├── middleware/   # Custom middleware (auth, etc.)
│   └── config/       # Configuration files
```

### Authentication & Authorization
- **JWT-based authentication** with bcrypt password hashing
- **Role-based access control** with three user types: `owner`, `tenant`, `admin`
- **Session persistence** using localStorage with automatic login detection
- **Phone verification** system with OTP support (Twilio integration ready)

### Frontend Architecture
- **Component-driven design** with role-specific UI components
- **Centralized state management** using React hooks and localStorage
- **Single Page Application** with React Router DOM for navigation
- **Responsive design** using Tailwind CSS with collapsible sidebar navigation
- **API layer abstraction** through `api.js` for all backend communication

### Backend Architecture
- **RESTful API design** with Express.js
- **Modular route organization** by feature (auth, properties, tenants, complaints, payments, maintenance)
- **Mongoose ODM** for MongoDB interactions with schema validation
- **Middleware pipeline** for authentication, CORS, and error handling
- **File upload support** with multer for property images and documents

### Data Models & Relationships
- **User Model**: Handles authentication, roles, and profile information
- **Property Model**: Comprehensive property data with embedded address, amenities, pricing, and availability
- **Tenant Assignment**: Properties reference current tenant via `currentTenant` field
- **Complaint/Maintenance System**: Separate models for tracking maintenance requests and status
- **Payment Tracking**: Models for rent payments with Razorpay integration

### Key Features Architecture
- **Property Management**: CRUD operations with image upload, search/filtering, and availability tracking
- **Tenant Management**: Application processing, lease tracking, and assignment workflows  
- **Maintenance System**: Complaint submission, priority management, status tracking, and resolution workflow
- **Payment System**: Rent collection tracking with Razorpay payment gateway integration
- **Dashboard Analytics**: Real-time statistics and performance metrics for property owners

### Environment Configuration
- **Development**: Uses `.env.development` for local API endpoints
- **Production**: Uses `.env.production` for deployed backend URLs
- **CORS Configuration**: Whitelist includes localhost and production domains (Vercel, Render)
- **MongoDB Connection**: Configurable via `MONGODB_URI` environment variable

### Deployment Architecture
- **Frontend**: Optimized for Vercel deployment with proper environment variable handling
- **Backend**: Configured for Render deployment with production-ready middleware
- **Database**: MongoDB Atlas or local MongoDB instance
- **File Storage**: Local file system for uploads (production should use cloud storage)

## Development Workflow

### Starting Development
1. Ensure MongoDB is running locally or configure cloud connection
2. Use quick start scripts for fastest setup, or manually start frontend/backend separately
3. Frontend automatically proxies API calls to backend during development

### Common Development Tasks
- **Adding new API endpoints**: Create routes in `Backend/routes/` and update frontend `api.js`
- **Database schema changes**: Modify Mongoose models in `Backend/models/`
- **New UI components**: Add to appropriate role directory in `frontend/src/components/`
- **Authentication changes**: Update middleware in `Backend/middleware/auth.js`

### Environment Variables
- **Vite prefix required**: Frontend environment variables must start with `VITE_`
- **Backend configuration**: JWT secrets, MongoDB URI, and third-party API keys
- **Payment integration**: Razorpay keys for payment processing
- **SMS integration**: Twilio credentials for phone verification

### Security Considerations
- **Password hashing**: bcrypt with salt rounds of 12
- **JWT expiration**: Tokens should have reasonable expiry times
- **Input validation**: Express-validator used for request sanitization
- **CORS policy**: Strict origin whitelist for production
- **File upload limits**: 10MB limit configured for property images and documents