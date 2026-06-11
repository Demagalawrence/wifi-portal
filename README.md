# WiFi Hotspot Portal - Complete Project

A full-stack WiFi hotspot captive portal system with Django backend and React frontend, featuring user authentication, payment integration, and session management.

## 🏗️ Project Structure

```
wifi portal/
├── backend/                 # Django REST API
│   ├── wifi_hotspot/       # Django project
│   ├── accounts/           # User management
│   ├── plans/              # Pricing plans
│   ├── payments/           # Payment processing
│   ├── sessions/           # Session management
│   ├── manage.py
│   └── requirements.txt
└── wifi-portal/            # React frontend
    ├── src/
    │   ├── components/
    │   ├── services/
    │   └── App.tsx
    └── package.json
```

## ✨ Features

### Backend (Django)
- **User Authentication**: Registration, login, profile management
- **Plan Management**: Flexible pricing plans with duration-based access
- **Payment Integration**: Airtel Money & MTN Mobile Money support
- **Session Management**: Real-time WiFi session tracking
- **Device Management**: MAC address tracking
- **Admin Dashboard**: Complete admin interface
- **REST API**: Full RESTful API with DRF

### Frontend (React)
- **Modern UI**: Dark theme with cyan/teal gradient design
- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: Live connection status
- **Form Validation**: Client-side validation with error handling
- **Loading States**: Spinners and progress indicators
- **Hover Effects**: Interactive UI elements
- **Authentication Flow**: Login/register with token management

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your settings

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (for admin access)
python manage.py createsuperuser

# Setup initial plans
python manage.py setup_plans

# Start development server
python manage.py runserver
```

Backend will be available at: `http://localhost:8000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd wifi-portal

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will be available at: `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `POST /api/accounts/register/` - User registration
- `POST /api/accounts/login/` - User login
- `POST /api/accounts/logout/` - User logout
- `GET /api/accounts/status/` - Get user status

### Plans
- `GET /api/plans/` - List all plans
- `GET /api/plans/{id}/` - Get plan details

### Payments
- `POST /api/payments/initiate/` - Initiate payment
- `GET /api/payments/{id}/status/` - Check payment status
- `POST /api/payments/{id}/simulate/` - Simulate payment (debug)

### Sessions
- `POST /api/sessions/create/` - Create WiFi session
- `GET /api/sessions/current/` - Get current session
- `POST /api/sessions/{id}/terminate/` - Terminate session

## 💳 Payment Integration

The system supports:
- **Airtel Money**: Rwanda mobile money
- **MTN Mobile Money**: Rwanda mobile money

For production deployment, update the following in `.env`:
```
AIRTEL_MONEY_API_URL=https://api.airtel.com/v1
AIRTEL_MONEY_CLIENT_ID=your-client-id
AIRTEL_MONEY_CLIENT_SECRET=your-client-secret

MTN_MONEY_API_URL=https://api.mtn.com/v1
MTN_MONEY_CLIENT_ID=your-client-id
MTN_MONEY_CLIENT_SECRET=your-client-secret
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | auto-generated |
| `DEBUG` | Debug mode | `True` |
| `ALLOWED_HOSTS` | Allowed hosts | `localhost,127.0.0.1` |
| `WIFI_SESSION_TIMEOUT` | Session timeout (seconds) | `3600` |

### Available Plans

| Plan | Duration | Price |
|------|----------|-------|
| 2 hours | 2 hours | 500/- |
| 12 hours | 12 hours | 1,000/- |
| 24 hours | 24 hours | 1,500/- |
| 3 days | 3 days | 3,000/- |
| 1 week | 1 week | 5,000/- |
| 1 month | 1 month | 20,000/- |

## 🎯 Usage Flow

1. **User Registration/Login**: Users create account or login
2. **Plan Selection**: Choose from available WiFi plans
3. **Payment**: Select payment method (Airtel/MTN) and complete payment
4. **Session Creation**: WiFi session is automatically created after payment
5. **WiFi Access**: User gets internet access for the selected duration
6. **Session Management**: Users can view and terminate their sessions

## 🔐 Security Features

- Token-based authentication
- CORS protection
- Input validation and sanitization
- Secure password handling
- Session timeout management
- Payment transaction logging

## 📊 Admin Features

Access admin panel at `http://localhost:8000/admin/`:

- User management
- Plan configuration
- Payment monitoring
- Session tracking
- Device management
- Analytics and reporting

## 🧪 Testing

### Backend Testing
```bash
# Run tests
python manage.py test

# Run specific app tests
python manage.py test accounts
```

### Frontend Testing
```bash
# Run tests
npm test
```

## 🚀 Deployment

### Backend Deployment
1. Set `DEBUG=False` in production
2. Configure production database
3. Set up proper `ALLOWED_HOSTS`
4. Configure SSL certificates
5. Set up production web server (Gunicorn + Nginx)

### Frontend Deployment
1. Build for production: `npm run build`
2. Deploy to static hosting (Vercel, Netlify)
3. Update API base URL in production

## 📝 Development Notes

- Backend runs on port 8000
- Frontend runs on port 3000
- CORS is configured for development
- SQLite database for development
- Payment simulation available in debug mode

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, call: +250 788 123 456

---

**Built with ❤️ using Django and React**
