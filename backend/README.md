# WiFi Hotspot Backend

A complete Django REST API for WiFi hotspot management with payment integration.

## Features

- **User Authentication**: Registration, login, and profile management
- **Plan Management**: Flexible pricing plans with duration-based access
- **Payment Integration**: Airtel Money and MTN Mobile Money support
- **Session Management**: Real-time WiFi session tracking and control
- **Device Management**: MAC address tracking and device registration
- **Admin Dashboard**: Complete admin interface for management

## API Endpoints

### Accounts
- `POST /api/accounts/register/` - User registration
- `POST /api/accounts/login/` - User login
- `POST /api/accounts/logout/` - User logout
- `GET /api/accounts/profile/` - Get user profile
- `GET /api/accounts/status/` - Get current user status

### Plans
- `GET /api/plans/` - List all active plans
- `GET /api/plans/{id}/` - Get plan details

### Payments
- `POST /api/payments/initiate/` - Initiate payment
- `GET /api/payments/{id}/status/` - Check payment status
- `GET /api/payments/history/` - Payment history
- `POST /api/payments/{id}/simulate/` - Simulate payment (debug only)

### Sessions
- `POST /api/sessions/create/` - Create WiFi session
- `GET /api/sessions/current/` - Get current session
- `GET /api/sessions/history/` - Session history
- `POST /api/sessions/{id}/terminate/` - Terminate session

## Setup Instructions

1. **Create virtual environment**:
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   ```bash
   copy .env.example .env
   # Edit .env with your settings
   ```

4. **Run migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser**:
   ```bash
   python manage.py createsuperuser
   ```

6. **Run development server**:
   ```bash
   python manage.py runserver
   ```

## Environment Variables

- `SECRET_KEY`: Django secret key
- `DEBUG`: Enable debug mode
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts
- `AIRTEL_MONEY_*`: Airtel Money API credentials
- `MTN_MONEY_*`: MTN Mobile Money API credentials

## Payment Integration

The backend supports both Airtel Money and MTN Mobile Money. Payment processors can be extended by implementing the `PaymentProcessor` base class.

## Session Management

Sessions are automatically managed based on plan duration. The system tracks:
- Session start/end times
- Data usage
- Device MAC addresses
- User activity

## Admin Interface

Access the admin interface at `/admin/` with your superuser credentials to manage:
- Users and profiles
- Pricing plans
- Payments and transactions
- WiFi sessions
- Network devices
