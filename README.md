# 🏠 LPRT - Landlord Property Rental Tool

A comprehensive full-stack property management system built with React and Node.js, designed to streamline property management for landlords and provide seamless rental experiences for tenants.

🌐 **Live Demo**: [https://rentifyyyy.netlify.app/](https://rentifyyyy.netlify.app/)

## ✨ Features

### 🔐 Authentication & User Management
- **Role-based Access Control**: Separate interfaces for Property Owners and Tenants
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **User Profiles**: Comprehensive user profile management with contact information

### 🏢 Property Management
- **Property CRUD Operations**: Add, edit, delete, and view properties
- **Advanced Search & Filtering**: Search by location, type, price range, and availability
- **Image Management**: Upload and manage property images
- **Detailed Property Information**: Comprehensive property details including amenities, specifications, and pricing
- **Availability Tracking**: Real-time status updates (Available, Rented, Maintenance, Reserved)

### 👥 Tenant Management
- **Tenant Assignment**: Assign tenants to properties with lease details
- **Rental Applications**: Streamlined application process for potential tenants
- **Tenant Profiles**: Detailed tenant information and rental history
- **Lease Management**: Track lease terms, start/end dates, and renewal status

### 🛠️ Complaint & Maintenance System
- **Maintenance Requests**: Submit and track maintenance issues
- **Priority Management**: Categorized complaints with priority levels
- **Status Tracking**: Real-time updates on complaint resolution
- **Communication System**: Notes and updates between tenants and owners
- **Rating System**: Tenant feedback on resolved complaints

### 💰 Financial Management
- **Rent Collection**: Track monthly rent payments
- **Deposit Management**: Security deposit tracking
- **Payment History**: Comprehensive payment records
- **Invoice Generation**: Automated invoice creation
- **Financial Reports**: Revenue analytics and payment statistics

### 📊 Analytics & Reporting
- **Dashboard Analytics**: Key performance indicators for property owners
- **Payment Statistics**: Revenue tracking and payment method analysis
- **Property Performance**: View counts, ratings, and tenant satisfaction
- **Complaint Analytics**: Maintenance request trends and resolution times

## 🚀 Tech Stack

### Frontend
- **React 19**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Lucide React**: Beautiful and consistent icon library
- **React Router DOM**: Client-side routing for single-page application

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Fast, unopinionated web framework
- **MongoDB**: NoSQL database for flexible data storage
- **Mongoose**: MongoDB object modeling for Node.js
- **JWT**: JSON Web Tokens for secure authentication
- **bcryptjs**: Password hashing for security
- **Express Validator**: Input validation and sanitization

### Development Tools
- **ESLint**: Code linting and quality enforcement
- **PostCSS**: CSS processing and optimization
- **Autoprefixer**: Automatic vendor prefixing

## 📁 Project Structure

```
LPRT(web)/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── Auth/                # Authentication components
│   │   │   ├── Login.jsx        # User login form
│   │   │   ├── Signup.jsx       # User registration form
│   │   │   ├── RoleSelection.jsx # Role selection interface
│   │   │   └── Layout.jsx       # Authentication layout
│   │   ├── owner/               # Property owner components
│   │   │   ├── PropertyManagement.jsx # Main property management
│   │   │   ├── AddPropertyModal.jsx   # Add property form
│   │   │   ├── EditPropertyModal.jsx  # Edit property form
│   │   │   └── PropertyDetailsModal.jsx # Property details view
│   │   └── tenants/             # Tenant components
│   ├── App.jsx                  # Main application component
│   ├── main.jsx                 # Application entry point
│   └── index.css                # Global styles
├── server/                      # Backend source code
│   ├── models/                  # Database models
│   │   ├── User.js             # User model with authentication
│   │   ├── Property.js         # Property model
│   │   └── Complaint.js        # Complaint/maintenance model
│   ├── routes/                  # API route handlers
│   │   ├── auth.js             # Authentication routes
│   │   ├── properties.js       # Property management routes
│   │   ├── complaints.js       # Complaint system routes
│   │   ├── tenants.js          # Tenant management routes
│   │   └── payments.js         # Payment management routes
│   ├── middleware/              # Custom middleware
│   │   └── auth.js             # Authentication middleware
│   ├── server.js                # Main server file
│   ├── package.json             # Backend dependencies
│   └── README.md                # Backend documentation
├── package.json                 # Frontend dependencies
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── README.md                    # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (v5 or higher)
- **npm** or **yarn**

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LPRT(web)
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Backend Setup

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/lprt_db
   JWT_SECRET=your-super-secret-jwt-key-here
   ```

4. **Start MongoDB**
   ```bash
   # Windows
   mongod
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

5. **Start backend server**
   ```bash
   npm run dev
   ```

6. **Verify backend is running**
   Navigate to `http://localhost:5000/api/health`

## 🎯 Usage Guide

### For Property Owners

1. **Registration & Login**
   - Select "Property Owner" role during registration
   - Complete profile with contact information
   - Login with email and password

2. **Property Management**
   - Add new properties with detailed information
   - Upload property images
   - Set pricing and availability
   - Track property performance

3. **Tenant Management**
   - View tenant applications
   - Assign tenants to properties
   - Manage lease agreements
   - Track rent payments

4. **Maintenance & Complaints**
   - Receive and track maintenance requests
   - Update complaint status
   - Communicate with tenants
   - Monitor resolution times

### For Tenants

1. **Registration & Login**
   - Select "Tenant" role during registration
   - Complete profile with preferences
   - Login with email and password

2. **Property Search**
   - Browse available properties
   - Apply filters by location, type, and price
   - View detailed property information
   - Submit rental applications

3. **Rental Management**
   - View current rental property
   - Submit maintenance requests
   - Track complaint resolution
   - Rate resolved complaints

4. **Payment Tracking**
   - View rent payment history
   - Track security deposits
   - Access payment invoices

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Properties
- `GET /api/properties` - Get all properties (with filtering)
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Complaints
- `POST /api/complaints` - Create complaint
- `GET /api/complaints` - Get complaints (with filtering)
- `PUT /api/complaints/:id` - Update complaint
- `POST /api/complaints/:id/notes` - Add note to complaint

### Tenants
- `GET /api/tenants` - Get all tenants (for owners)
- `GET /api/tenants/my-rental` - Get current rental (for tenants)
- `POST /api/tenants/apply` - Apply for property
- `PUT /api/tenants/assign` - Assign tenant to property

### Payments
- `POST /api/payments/rent` - Record rent payment
- `GET /api/payments/rent` - Get rent payment history
- `GET /api/payments/rent/stats` - Get payment statistics

## 🚀 Deployment

### Frontend Deployment
1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred hosting service**
   - Vercel, Netlify, or AWS S3
   - Update API base URL for production

### Backend Deployment
1. **Set production environment variables**
   ```env
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   JWT_SECRET=your-production-jwt-secret
   ```

2. **Deploy to your preferred hosting service**
   - Heroku, AWS EC2, or DigitalOcean
   - Set up reverse proxy (Nginx) for production
   - Enable HTTPS and rate limiting

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and backend documentation
- **Issues**: Create an issue in the repository
- **Questions**: Contact the development team

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ User authentication and role management
- ✅ Basic property management
- ✅ Complaint system
- ✅ Tenant management
- ✅ Payment tracking

### Phase 2 (Planned)
- 🔄 File upload functionality
- 🔄 Email notifications
- 🔄 Real-time messaging
- 🔄 Advanced reporting

### Phase 3 (Future)
- 📋 Mobile app development
- 📋 Payment gateway integration
- 📋 Document management
- 📋 Maintenance scheduling
- 📋 Property analytics dashboard

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **MongoDB** for the flexible database solution
- **Express.js** for the robust web framework
- **Open Source Community** for inspiration and tools

---
