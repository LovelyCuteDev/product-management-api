## Backend – Product Management API (NestJS)

This is a NestJS + TypeORM REST API for the product management app.  
It provides authentication, user management (including admin/super‑admin), products, cart, orders, and image uploads.

### Tech stack

- **Runtime**: Node.js 20+
- **Framework**: NestJS 11
- **Database**: MySQL 8+
- **ORM**: TypeORM 0.3
- **Auth**: JWT (Bearer tokens)

### 1. Install dependencies

From the `backend` directory:

```bash
npm install
```

### 2. Environment configuration

Create a `.env` file in `backend` (same folder as `package.json`):

```bash
cp .env.example .env   # if you have one, otherwise create manually
```

Minimum variables you should define:

```bash
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_db_password
DB_DATABASE=hca
DB_LOGGING=false
DB_SSL=false

# JWT
JWT_SECRET=dev-secret
JWT_EXPIRES_IN=1d

# Initial super admin user (for seeding)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
ADMIN_NAME=Admin Name
```

Notes:

- `typeorm.config.ts` reads DB settings from environment variables.  
- `JWT_SECRET` should be changed in non‑dev environments.

### 3. Database setup & migrations

Make sure the MySQL database defined by `DB_DATABASE` exists, then run:

```bash
# Run all pending migrations
npm run db:migrate

# (Optional) revert last migration
npm run db:migrate:revert
```

### 4. Seed initial super admin user

The seed script will ensure at least one `admin` user exists and will either
create or upgrade the user at `ADMIN_EMAIL` to admin.

```bash
npm run db:seed
```

After this, you can log into the frontend using `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### 5. Running the backend

**Development (watch mode):**

```bash
npm run start:dev
```

**Regular development run:**

```bash
npm run start
```

**Production build + run:**

```bash
npm run build
npm run start:prod
```

The API will be available at:

- Base URL: `http://localhost:3000/api`
- Static uploads (product images): `http://localhost:3000/uploads/...`

### 6. Important endpoints (high level)

- `POST /api/auth/signup` – register new user
- `POST /api/auth/login` – login, returns JWT and user info
- `GET /api/auth/me` – get current user profile (requires Bearer token)
- `GET /api/products` / `GET /api/products/:id` – list and view products
- `POST /api/products` / `PUT /api/products/:id` / `DELETE /api/products/:id` – manage products (admin only)
- `POST /api/products/:id/images` – upload up to 5 images for a product (admin only)
- `GET /api/cart` / `POST /api/cart` – cart operations
- `GET /api/orders` / `GET /api/orders/:id` – orders
- `GET /api/users` / `POST /api/users` / `PUT /api/users/:id` / `DELETE /api/users/:id` – user management (admin only)

### 7. Static file uploads

- Uploaded product images are stored under `backend/uploads/products`.
- The app serves files from the `uploads` folder at `/uploads/*` using `useStaticAssets` in `main.ts`.
- Make sure the `uploads` directory is writable by the Node process.

### 8. Testing & linting

```bash
# Lint
npm run lint

# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Coverage
npm run test:cov
```

### 9. Common dev tips

- If you change entities or add new tables, generate or create new TypeORM migrations and run `npm run db:migrate`.
