# 🚀 TableTap Development Quick Start Guide

This quick start guide will get you up and running with the TableTap restaurant ordering system development environment in minutes.

## 📋 Prerequisites Checklist

Before you begin, ensure you have the following installed:

- [ ] **Node.js 24.x**: Download from [nodejs.org](https://nodejs.org/)
- [ ] **npm 11.4.2+**: Comes with Node.js or update with `npm install -g npm@latest`
- [ ] **PostgreSQL 15+**: Database server
- [ ] **Redis 7+**: In-memory data store
- [ ] **Git**: Version control system

### Quick Installation Commands

```bash
# Install Node.js via NVM (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 24
nvm use 24

# Verify installations
node --version    # Should show v24.x.x
npm --version     # Should show 11.4.2+
psql --version    # Should show 15+
redis-cli --version  # Should show 7+
```

## 🛠️ Project Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/cskiwi/table-tap.git
cd table-tap

# Install dependencies (this may take a few minutes)
npm install

# Verify Nx CLI is available
npx nx --version
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your local settings
# Required variables:
```

**Edit `.env` file:**
```bash
# Database Configuration
DATABASE_URL=postgresql://tabletap:password@localhost:5432/tabletap_dev
REDIS_URL=redis://localhost:6379

# Authentication (Auth0) - Get from Auth0 Dashboard
AUTH0_DOMAIN=dev-tabletap.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_AUDIENCE=https://api.tabletap.local

# Application URLs
APP_URL=http://localhost:4200
API_URL=http://localhost:3000

# Security
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters

# Payment Gateway (Development)
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 3. Database Setup

```bash
# Create database
createdb tabletap_dev

# Run migrations to set up schema
npm run migrate

# Verify database connection
npm run db:status
```

### 4. Start Development Environment

```bash
# Start all services (API + Frontend)
npm run start:all

# Or start services individually:
npm run start:api      # Backend only (port 3000)
npm run start:app      # Frontend only (port 4200)
```

## 🌐 Access Your Application

Once all services are running:

- **Customer App**: http://localhost:4200
- **API Server**: http://localhost:3000
- **GraphQL Playground**: http://localhost:3000/graphql
- **API Health Check**: http://localhost:3000/health

## 🔧 Development Tools

### Available Scripts

```bash
# Development
npm run start              # Start customer app only
npm run start:all          # Start all applications
npm run start:api          # Start API server only

# Building
npm run build             # Build all applications for production
npm run build:api         # Build API server only
npm run build:app         # Build frontend only

# Testing
npm run test              # Run all unit tests
npm run test:watch        # Run tests in watch mode
npm run test:e2e          # Run end-to-end tests
npm run test:coverage     # Generate test coverage report

# Code Quality
npm run lint              # Lint all code
npm run lint:fix          # Auto-fix linting issues
npm run format            # Format code with Prettier

# Database Management
npm run migrate           # Run database migrations
npm run migrate:create    # Create new migration
npm run migrate:undo      # Revert last migration
npm run migrate:reset     # Reset database (development only)

# Nx Workspace
npx nx graph              # View project dependency graph
npx nx affected:test      # Test only affected projects
npx nx affected:build     # Build only affected projects
```

### IDE Setup (VS Code Recommended)

Install recommended extensions:

```bash
# Open VS Code
code .

# Extensions will be suggested automatically, or install manually:
# - Angular Language Service
# - ESLint
# - Prettier
# - TypeScript Hero
# - GitLens
```

## 🏗️ Project Structure Overview

```
table-tap/
├── apps/
│   ├── api/                 # NestJS backend application
│   │   ├── src/main.ts     # API entry point
│   │   └── ...
│   ├── app/                 # Angular frontend application
│   │   ├── src/main.ts     # Frontend entry point
│   │   └── ...
│   └── app-e2e/            # End-to-end tests
├── libs/
│   ├── backend/
│   │   ├── database/       # TypeORM entities and migrations
│   │   ├── graphql/        # GraphQL resolvers and schemas
│   │   └── authorization/  # Authentication and authorization
│   ├── frontend/
│   │   ├── components/     # Reusable UI components
│   │   ├── modules/        # Feature modules (auth, GraphQL, etc.)
│   │   └── pages/          # Route-specific page components
│   └── models/             # Shared TypeScript models and types
├── docs/                   # Project documentation
├── database/               # Database-related files
└── src/                    # Additional source files (entities, etc.)
```

## 🧪 First Steps - Verify Setup

### 1. Test API Connection

```bash
# Test health endpoint
curl http://localhost:3000/health

# Expected response:
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

### 2. Test GraphQL

Visit http://localhost:3000/graphql and run:

```graphql
query {
  __schema {
    types {
      name
    }
  }
}
```

### 3. Test Frontend

Navigate to http://localhost:4200 and verify the application loads.

## 🐛 Common Issues & Solutions

### Port Already in Use
```bash
# Find process using port
lsof -ti:3000
kill -9 <process_id>

# Or use different ports
PORT=3001 npm run start:api
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Restart PostgreSQL (macOS)
brew services restart postgresql

# Restart PostgreSQL (Ubuntu)
sudo systemctl restart postgresql
```

### Node Modules Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Migration Errors
```bash
# Reset database (development only)
npm run migrate:reset

# Or manually drop and recreate
dropdb tabletap_dev
createdb tabletap_dev
npm run migrate
```

## 📚 Next Steps

1. **Explore the Code**: Start with `apps/api/src/main.ts` and `apps/app/src/main.ts`
2. **Read Documentation**: Check out the [comprehensive documentation](./COMPREHENSIVE_PROJECT_DOCUMENTATION.md)
3. **Run Tests**: Execute `npm test` to ensure everything works
4. **Make Changes**: Try modifying a component or resolver
5. **Join Development**: Check our [Contributing Guidelines](../CONTRIBUTING.md)

## 🆘 Getting Help

- 📖 [Full Documentation](./COMPREHENSIVE_PROJECT_DOCUMENTATION.md)
- 🐛 [Report Issues](https://github.com/cskiwi/table-tap/issues)
- 💬 [Discussions](https://github.com/cskiwi/table-tap/discussions)
- 📧 [Email Support](mailto:dev-support@tabletap.com)

---

**Happy Coding! 🚀**

*This quick start guide should have you up and running in under 15 minutes. If you encounter any issues, please refer to the troubleshooting section or reach out for help.*