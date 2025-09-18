# LPRT Backend Server

A comprehensive backend API for the LPRT (Landlord Property Rental Tool) property management system.

## Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Owner, Tenant, Admin)
  - Secure password hashing with bcrypt

- **Property Management**
  - CRUD operations for properties
  - Property search and filtering
  - Image management
  - Availability tracking

- **Tenant Management**
  - Tenant assignment and removal
  - Rental applications
  - Tenant profiles

- **Complaint System**
  - Maintenance request tracking
  - Priority and status management
  - Notes and communication
  - Rating system

- **Payment Management**
  - Rent payment tracking
  - Deposit management
  - Payment statistics
  - Invoice generation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator
- **Security**: bcryptjs for password hashing
- **File Upload**: Multer (ready for implementation)

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lprt-web/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/lprt_db
   JWT_SECRET=your-super-secret-jwt-key-here
   ```

4. **Start MongoDB**
   ```bash
   # On Windows
   mongod
   
   # On macOS/Linux
   sudo systemctl start mongod
   ```

5. **Run the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - User logout

### Properties
- `GET /api/properties` - Get all properties (with filtering)
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `GET /api/properties/owner/my-properties` - Get owner's properties
- `POST /api/properties/:id/images` - Add images to property
- `DELETE /api/properties/:id/images/:imageId` - Remove image

### Complaints
- `POST /api/complaints` - Create complaint
- `GET /api/complaints` - Get complaints (with filtering)
- `GET /api/complaints/:id` - Get complaint by ID
- `PUT /api/complaints/:id` - Update complaint
- `POST /api/complaints/:id/notes` - Add note to complaint
- `PUT /api/complaints/:id/status` - Update complaint status
- `POST /api/complaints/:id/rating` - Rate resolved complaint
- `GET /api/complaints/stats/summary` - Get complaint statistics

### Tenants
- `GET /api/tenants` - Get all tenants (for owners)
- `GET /api/tenants/my-rental` - Get current rental (for tenants)
- `POST /api/tenants/apply` - Apply for property
- `PUT /api/tenants/assign` - Assign tenant to property
- `PUT /api/tenants/remove` - Remove tenant from property
- `GET /api/tenants/profile/:id` - Get tenant profile

### Payments
- `POST /api/payments/rent` - Record rent payment
- `GET /api/payments/rent` - Get rent payment history
- `GET /api/payments/rent/stats` - Get payment statistics
- `POST /api/payments/deposit` - Record deposit payment
- `POST /api/payments/refund` - Process refund
- `GET /api/payments/invoices/:paymentId` - Generate invoice

## Database Models

### User
- Basic info (name, email, password, role)
- Contact details (phone, address)
- Profile image and verification status
- Timestamps and activity tracking

### Property
- Property details (title, description, type)
- Address and coordinates
- Property specifications (bedrooms, bathrooms, area)
- Amenities and images
- Pricing and availability
- Owner and tenant references

### Complaint
- Complaint details (title, description, category)
- Priority and status tracking
- Property and user references
- Notes and communication history
- Rating and feedback system

## Security Features

- **Password Security**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation
- **Role-based Access**: Granular permission control
- **Data Sanitization**: Protection against injection attacks

## Error Handling

- Centralized error handling middleware
- Structured error responses
- Validation error formatting
- HTTP status code compliance

## Development

### Project Structure
```
server/
├── models/          # Database models
├── routes/          # API route handlers
├── middleware/      # Custom middleware
├── uploads/         # File uploads (if implemented)
├── server.js        # Main server file
├── package.json     # Dependencies
└── README.md        # This file
```

### Adding New Features

1. **Create Model**: Add new schema in `models/` directory
2. **Create Routes**: Add new route handlers in `routes/` directory
3. **Update Server**: Register new routes in `server.js`
4. **Add Validation**: Include input validation using express-validator
5. **Test**: Test endpoints with Postman or similar tool

### Code Style

- Use ES6+ features
- Follow Express.js best practices
- Implement proper error handling
- Add comprehensive validation
- Use meaningful variable names
- Add JSDoc comments for complex functions

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Environment Variables
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure production MongoDB URI
- Set up proper CORS origins

### Production Considerations
- Use PM2 or similar process manager
- Set up reverse proxy (Nginx)
- Enable HTTPS
- Implement rate limiting
- Set up monitoring and logging
- Use environment-specific configurations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Roadmap

- [ ] File upload functionality
- [ ] Email notifications
- [ ] Real-time messaging
- [ ] Advanced reporting
- [ ] Mobile app API
- [ ] Payment gateway integration
- [ ] Document management
- [ ] Maintenance scheduling
