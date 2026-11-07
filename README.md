# RentHub

A full-stack property rental platform that connects landlords and tenants. Landlords can create, edit, and manage property listings with image uploads, while tenants can browse properties, save favourites, post comments and replies, and send inquiries directly to landlords. The application uses role-based access control to separate landlord and tenant functionality across the frontend and backend.


**Live Website:**


## Project Overview

RentHub is a property rental marketplace built with Angular 22 on the frontend and Express 5 on the backend. The application supports two user roles: tenants and landlords. Landlords can create and manage property listings, while tenants can search and filter properties, save favourites, post comments with threaded replies, and send inquiries to property owners. All data is persisted in a PostgreSQL database using Prisma ORM, and property images are stored on Cloudinary through signed uploads.

## Key Features

- **User authentication** — Register and login as a tenant or landlord with JWT session persistence in localStorage.
- **Role-based access control** — Route guards on both frontend and backend restrict features based on user role (TENANT or LANDLORD).
- **Property management** — Landlords can create, edit, delete, and view their own property listings.
- **Property browsing** — Public home page with search, city filtering, sorting (newest, oldest, rent ascending/descending), and paginated results.
- **Image uploads** — Properties support up to 8 images uploaded directly to Cloudinary via backend-generated signed signatures.
- **Featured carousel** — Auto-rotating carousel of the 5 newest active properties on the home page.
- **Property details** — Dedicated property page with full details, image gallery, amenities, and owner information.
- **Comments and replies** — Public comment threads with nested replies; only the comment author can delete their comment or reply.
- **Favourites** — Tenants can save and remove properties from their favourites list.
- **Inquiries and notifications** — Tenants can send inquiries to landlords; landlords receive notifications, mark them as read individually or in bulk, and view sent inquiries.

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | Angular | 22.2.x |
| Frontend language | TypeScript | ~6.0.2 |
| Frontend state | RxJS | ~7.8.0 |
| Frontend testing | Vitest | 5.0.0 |
| Backend framework | Express | 5.3.0 (ES modules) |
| Backend language | JavaScript (Node.js) | — |
| Backend testing | None configured | — |
| Database | PostgreSQL (Neon) | — |
| ORM | Prisma | 7.10.1 |
| Authentication | JWT (jsonwebtoken) | 9.0.3 |
| Password hashing | bcryptjs | 3.0.3 |
| Request validation | Zod | 4.6.7 |
| Image storage | Cloudinary SDK | 2.11.0 |
| Security | helmet, cors | — |
| HTTP logging | morgan | — |
| Error handling | Centralized Express middleware | — |

## Frontend

The frontend is a standalone Angular 22 application built with TypeScript. It uses Angular's standalone component architecture with the Angular router, HttpClient with interceptors, and RxJS for reactive API communication.

### Core architecture

- **Bootstrap** — `src/main.ts` bootstraps `AppComponent` using `bootstrapApplication` with `appConfig` from `src/app/app.config.ts`.
- **Change detection** — `provideZonelessChangeDetection()` is used, so async state updates require explicit `ChangeDetectorRef.markForCheck()` calls.
- **HTTP** — `provideHttpClient` with an `authInterceptor` that attaches the JWT bearer token only to requests directed at the backend API URL (third-party URLs such as Cloudinary are excluded).
- **Routing** — Configured in `src/app/app.routes.ts` with `authGuard` and `roleGuard` protecting role-specific routes.

### Services

- `src/app/services/api.service.ts` — Centralized HTTP client wrapper with GET, POST, PUT, PATCH, DELETE methods and query parameter handling.
- `src/app/services/auth.service.ts` — Manages login, registration, logout, JWT token and user profile storage in localStorage, and exposes `currentUser$`, `currentUser`, `token`, and `isAuthenticated`.
- `src/app/features/properties/services/property.service.ts` — Property CRUD, search, filtering, pagination, and featured listings. Normalizes backend response shapes (with or without `data` wrapper).
- `src/app/features/properties/services/cloudinary.service.ts` — Two-step image upload: requests a signed signature from the backend, then POSTs the image file directly to Cloudinary.
- `src/app/features/comments/services/comment.service.ts` — Comment and reply CRUD operations.
- `src/app/features/inquiries/services/inquiry.service.ts` — Inquiry creation, notification retrieval, sent inquiries, and mark-as-read operations.
- `src/app/features/favourites/services/favourite.service.ts` — Favourite add, list, and remove operations.

### Guards and interceptors

- `src/app/core/guards/auth.guard.ts` — Redirects unauthenticated users to `/login`.
- `src/app/core/guards/role.guard.ts` — Restricts routes to users with the specified role(s); redirects unauthorized users to `/`.
- `src/app/core/interceptors/auth.interceptor.ts` — Attaches `Authorization: Bearer <token>` header to backend API requests only.

### Pages and components

- `HomeComponent` — Property listing with search, city filter, sort, pagination, featured carousel, and tenant favourites integration.
- `CreatePropertyComponent` — Create and edit property forms with image upload, preview step, and validation.
- `PropertyDetailsComponent` — Property detail view with comments, replies, inquiry form, and favourite toggle.
- `MyPropertiesComponent` — Landlord's own properties with edit and delete actions.
- `FavouritesComponent` — Tenant's saved properties.
- `NotificationsComponent` — Landlord's received inquiries with mark-as-read and mark-all-as-read.
- `SentInquiriesComponent` — Tenant's sent inquiries.
- `LoginComponent` / `SignupComponent` — Authentication forms.
- `NavbarComponent` — Role-aware navigation with logout.
- `PropertyCardComponent` — Reusable property summary card with image fallback and favourite emission.
- `PaginationComponent` — Page navigation for paginated lists.
- `FooterComponent` — Shared footer with current year.

### State management

No external state management library (e.g., NgRx, Signals store) is used. Component state is managed locally with Angular services and RxJS observables. Authentication state is persisted in localStorage and exposed via a `BehaviorSubject` in `AuthService`.

### Testing

Unit tests are written with Vitest and jsdom. Test files are located in `src/tests/` and `src/app/app.spec.ts`. Run with `npm test` from the `frontend/` directory.

## Backend

The backend is an Express 5 application written in ES module JavaScript. It follows a controller-service-route-middleware architecture with centralized error handling.

### Entry point

- `src/server.js` — Warms the PostgreSQL connection pool, then starts the Express server on the configured port.
- `src/app.js` — Configures the Express app with helmet, CORS (restricted to `CLIENT_URL`), JSON/urlencoded body parsing, morgan request logging in development, route registration, and 404/error middleware.

### Route modules

- `src/routes/auth.routes.js` — Public auth endpoints (`/register`, `/login`) and protected `/me`.
- `src/routes/property.routes.js` — Public property listing and featured endpoints; protected landlord-only endpoints for create, update, delete, mine, and image-signature.
- `src/routes/favourite.routes.js` — Tenant-only favourite endpoints (GET, POST, DELETE).
- `src/routes/comment.routes.js` — Public comment retrieval; protected create, reply, and delete.
- `src/routes/inquiry.routes.js` — Tenant inquiry creation and sent inquiries; landlord notification endpoints with mark-read and mark-all-read.
- `src/routes/health.routes.js` — Health check endpoint returning server status and timestamp.

### Middleware

- `src/middleware/auth.middleware.js` — Verifies JWT and attaches `req.user` with `id` and `role`.
- `src/middleware/authorize.middleware.js` — Role-based access control factory used after auth middleware.
- `src/middleware/validate.middleware.js` — Zod schema validation for request bodies with field-level error details.
- `src/middleware/error.middleware.js` — Centralized error handler; masks 500 errors in production.
- `src/middleware/not-found.middleware.js` — Returns 404 for unmatched routes.

### Services

- `src/services/auth.service.js` — Registration, login, token creation (JWT with configurable expiry), password hashing (bcrypt 12 salt rounds), and user lookup.
- `src/services/property.service.js` — Property CRUD with search, filtering, sorting, pagination, amenity normalization, image management, and Cloudinary cleanup on delete/update.
- `src/services/cloudinary.service.js` — Generates signed Cloudinary upload parameters (API key, timestamp, folder, signature).
- `src/services/favourite.service.js` — Tenant favourite operations with duplicate prevention.
- `src/services/comment.service.js` — Comment and reply operations with author-only deletion.
- `src/services/inquiry.service.js` — Inquiry creation, notification retrieval, sent inquiries, and mark-as-read operations.

### Validators

- `src/validators/auth.validator.js` — Registration and login schemas.
- `src/validators/property.validator.js` — Property create/update schemas with field constraints and max 10 images.
- `src/validators/property-query.validator.js` — Search, filter, sort, and pagination query validation.
- `src/validators/comment.validator.js` — Comment content validation (1–2000 characters).
- `src/validators/inquiry.validator.js` — Inquiry message validation (5–2000 characters).
- `src/validators/inquiry-query.validator.js` — Notification list query validation.

### Utilities

- `src/utils/app-error.js` — Custom `AppError` class with HTTP status code and optional details.
- `src/utils/async-handler.js` — Wraps async Express handlers to forward rejections to error middleware.

## Database and ORM

RentHub uses **PostgreSQL** hosted on **Neon** with **Prisma ORM** (version 7.10.1). The database schema is defined in `backend/prisma/schema.prisma` and migrations are stored in `backend/prisma/migrations/`.

### Database models

| Model | Description |
|-------|-------------|
| `User` | Tenant or landlord account with email, hashed password, and role. |
| `Property` | Rental listing with address, rent, amenities, images, and owner reference. |
| `PropertyImage` | Images linked to a property with position ordering. |
| `Amenity` | Reusable amenity names (e.g., Gym, Pool). |
| `PropertyAmenity` | Junction table linking properties to amenities. |
| `Favourite` | Tenant-saved properties (unique user-property pair). |
| `Comment` | Property comments with optional `parentId` for threaded replies. |
| `Inquiry` | Tenant-to-landlord messages with read status. |

### Database indexes

Indexes are defined on frequently queried columns including `city/area`, `monthlyRent`, `leaseType/furnishingStatus`, `propertyType`, `status/createdAt`, `status/monthlyRent`, `status/propertyType`, `ownerId/createdAt`, `propertyId/position` (images), `propertyId/createdAt` (comments), `parentId` (replies), and `recipientId/isRead/createdAt` (inquiries).

### Prisma commands

| Command | Purpose |
|---------|---------|
| `npm run db:generate` | Generate Prisma Client from schema. |
| `npm run db:migrate` | Run Prisma migrations against the database. |
| `npm run db:studio` | Open Prisma Studio to inspect the database. |

## External Services and Integrations

- **Cloudinary** — Stores property images. The backend generates signed upload parameters (API key, timestamp, folder, signature) and the frontend uploads image files directly to Cloudinary. Only image URLs and public IDs are stored in the database.
- **Neon PostgreSQL** — Managed PostgreSQL database with connection pooling via `@prisma/adapter-pg` and the `pg` Pool.

## Application Architecture

```
RentHub/
├── frontend/                 # Angular 22 standalone application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # Guards, interceptors, models
│   │   │   ├── services/       # AuthService, ApiService
│   │   │   ├── features/       # Feature-based modules (auth, properties, comments, inquiries, favourites)
│   │   │   │   ├── properties/
│   │   │   │   │   ├── pages/    # Home, CreateProperty, PropertyDetails, MyProperties
│   │   │   │   │   └── services/ # PropertyService, CloudinaryService
│   │   │   │   ├── comments/
│   │   │   │   ├── inquiries/
│   │   │   │   └── favourites/
│   │   │   ├── shared/         # Navbar, Footer, PropertyCard, Pagination
│   │   │   ├── app.component.ts
│   │   │   ├── app.routes.ts   # Route definitions with guards
│   │   │   └── app.config.ts   # Angular application config
│   │   ├── environments/       # environment.ts (apiUrl)
│   │   └── main.ts             # Application bootstrap
│   ├── package.json            # npm scripts and dependencies
│   ├── angular.json            # Angular build configuration
│   ├── vitest.config.ts        # Vitest test configuration
│   └── tsconfig*.json          # TypeScript configuration
│
├── backend/                    # Express 5 REST API
│   ├── src/
│   │   ├── config/             # env, prisma, cloudinary configuration
│   │   ├── controllers/        # Route handlers (auth, property, favourite, comment, inquiry)
│   │   ├── routes/             # Express route definitions
│   │   ├── services/           # Business logic (auth, property, cloudinary, favourite, comment, inquiry)
│   │   ├── middleware/         # auth, authorize, validate, error, not-found
│   │   ├── utils/              # AppError, asyncHandler
│   │   ├── validators/         # Zod schemas for request validation
│   │   ├── app.js              # Express app configuration
│   │   └── server.js           # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # SQL migration files
│   ├── .env                    # Environment variables (not committed)
│   └── package.json            # npm scripts and dependencies
│
└── README.md                   # This file
```

## Project Folder Structure

### Frontend (`frontend/`)

| Path | Purpose |
|------|---------|
| `src/main.ts` | Application bootstrap entry point |
| `src/app/app.config.ts` | Angular providers (routing, HTTP, change detection) |
| `src/app/app.routes.ts` | All application routes with guards |
| `src/app/core/models/models.ts` | Shared TypeScript interfaces and types |
| `src/app/core/guards/` | `auth.guard.ts`, `role.guard.ts` |
| `src/app/core/interceptors/` | `auth.interceptor.ts` |
| `src/app/services/` | `auth.service.ts`, `api.service.ts` |
| `src/app/features/auth/pages/` | `login.component.ts`, `signup.component.ts` |
| `src/app/features/properties/pages/` | `home.component.ts`, `create-property.component.ts`, `property-details.component.ts`, `my-properties.component.ts` |
| `src/app/features/properties/services/` | `property.service.ts`, `cloudinary.service.ts` |
| `src/app/features/comments/services/` | `comment.service.ts` |
| `src/app/features/inquiries/services/` | `inquiry.service.ts` |
| `src/app/features/favourites/services/` | `favourite.service.ts` |
| `src/app/features/favourites/pages/` | `favourites.component.ts` |
| `src/app/features/inquiries/pages/` | `notifications.component.ts`, `sent-inquiries.component.ts` |
| `src/app/shared/components/` | `navbar`, `footer`, `property-card`, `pagination` |
| `src/environments/environment.ts` | API URL configuration |
| `src/tests/` | Vitest unit test files |

### Backend (`backend/`)

| Path | Purpose |
|------|---------|
| `src/server.js` | Server entry point |
| `src/app.js` | Express app configuration and middleware |
| `src/config/env.js` | Environment variable loading |
| `src/config/prisma.js` | Prisma Client with PostgreSQL connection pool |
| `src/config/cloudinary.js` | Cloudinary SDK configuration |
| `src/controllers/` | Route handlers for each feature |
| `src/routes/` | Express route definitions |
| `src/services/` | Business logic layer |
| `src/middleware/` | Auth, authorization, validation, error handling |
| `src/utils/` | AppError class, async handler wrapper |
| `src/validators/` | Zod request validation schemas |
| `prisma/schema.prisma` | Database schema definition |
| `prisma/migrations/` | SQL migration files |
| `.env` | Environment variables (not committed) |

## Database Overview

The database schema uses UUID primary keys for all models and enforces referential integrity with cascade deletes on dependent relations.

- **User** — `id`, `name`, `email` (unique), `passwordHash`, `role` (TENANT\|LANDLORD), timestamps.
- **Property** — `id`, `propertyType` (APARTMENT\|BUILDING), `propertyName`, `sharedProperty`, `address`, `area`, `city`, `state`, `postalCode`, `squareFeet`, `leaseType`, `monthlyRent` (decimal), `isNegotiable`, `priceMode`, `furnishingStatus`, `vegetarianPreference`, `contactPhone` (optional), `title`, `description` (max 1400 chars), `status` (ACTIVE\|INACTIVE\|RENTED), `ownerId` (foreign key to User), timestamps.
- **PropertyImage** — `id`, `imageUrl`, `publicId` (Cloudinary), `position`, `propertyId`, timestamps. Cascade delete on property removal.
- **Amenity** — `id`, `name` (unique). Reusable amenity names.
- **PropertyAmenity** — Junction table: `propertyId`, `amenityId`. Composite primary key.
- **Favourite** — `userId`, `propertyId` (composite primary key), `createdAt`. Tenant-saved properties.
- **Comment** — `id`, `content`, `userId`, `propertyId`, `parentId` (optional, self-referential for replies), timestamps. Supports threaded replies.
- **Inquiry** — `id`, `message`, `senderId`, `recipientId`, `propertyId`, `isRead`, `createdAt`. Tenant-to-landlord messages.

## Authentication and Authorization

### Authentication

Users register with `name`, `email`, `password`, and `role` (TENANT or LANDLORD). Passwords are hashed with bcrypt (12 salt rounds). Upon successful login or registration, the backend returns a JWT and user data. The JWT contains the user's `id` (as `sub`) and `role`, with a configurable expiry (default 1 day). The frontend stores the token and user profile in `localStorage` and restores them on page reload.

### Authorization

Two layers of authorization are enforced:

1. **Frontend route guards** — `authGuard` requires authentication; `roleGuard` restricts routes to specific roles (e.g., LANDLORD-only for property creation, TENANT-only for favourites and sent inquiries).
2. **Backend middleware** — `authMiddleware` verifies the JWT and attaches `req.user`. `authorize(role)` restricts endpoints to specific roles. For example, property creation, update, and deletion require the LANDLORD role; favourites require TENANT.

### Protected routes

| Frontend Route | Required Role | Backend Equivalent |
|---------------|---------------|-------------------|
| `/properties/create` | LANDLORD | `POST /api/properties` |
| `/properties/mine` | LANDLORD | `GET /api/properties/mine` |
| `/properties/:id/edit` | LANDLORD | `PUT /api/properties/:id`, `DELETE /api/properties/:id` |
| `/favourites` | TENANT | `GET/POST/DELETE /api/favourites` |
| `/notifications` | LANDLORD | `GET/PATCH /api/inquiries/notifications` |
| `/inquiries/sent` | TENANT | `GET /api/inquiries/sent` |

## API Overview

All API routes are prefixed with `/api`.

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Authenticate and receive JWT | No |
| GET | `/api/auth/me` | Get current user profile | Yes |

### Properties

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/properties` | List active properties with search, filter, sort, pagination | No |
| GET | `/api/properties/featured` | Get 5 newest active properties | No |
| GET | `/api/properties/:id` | Get a single active property | No |
| GET | `/api/properties/mine` | Get landlord's own properties | Yes (LANDLORD) |
| POST | `/api/properties` | Create a property listing | Yes (LANDLORD) |
| PUT | `/api/properties/:id` | Update a property (owner only) | Yes (LANDLORD) |
| DELETE | `/api/properties/:id` | Delete a property (owner only) | Yes (LANDLORD) |
| POST | `/api/properties/image-signature` | Get signed Cloudinary upload parameters | Yes (LANDLORD) |

### Favourites

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/favourites` | List tenant's favourites | Yes (TENANT) |
| POST | `/api/favourites/:propertyId` | Add property to favourites | Yes (TENANT) |
| DELETE | `/api/favourites/:propertyId` | Remove property from favourites | Yes (TENANT) |

### Comments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/properties/:propertyId/comments` | Get comments with replies | No |
| POST | `/api/properties/:propertyId/comments` | Create a comment | Yes |
| POST | `/api/properties/:propertyId/comments/:commentId/replies` | Reply to a comment | Yes |
| DELETE | `/api/comments/:commentId` | Delete own comment or reply | Yes |

### Inquiries

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/properties/:propertyId/inquiries` | Send inquiry to landlord | Yes (TENANT) |
| GET | `/api/inquiries/sent` | Get tenant's sent inquiries | Yes (TENANT) |
| GET | `/api/inquiries/notifications` | Get landlord's notifications | Yes (LANDLORD) |
| PATCH | `/api/inquiries/:inquiryId/read` | Mark notification as read | Yes (LANDLORD) |
| PATCH | `/api/inquiries/read-all` | Mark all notifications as read | Yes (LANDLORD) |

### Health

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Health check | No |

## Image Upload Workflow

Property images follow a two-step signed upload process:

1. **Backend signature generation** — The frontend requests `POST /api/properties/image-signature`. The backend generates a Cloudinary signature using `cloudinary.utils.api_sign_request()` with `timestamp` and `folder`, returning `cloudName`, `apiKey`, `timestamp`, `folder`, and `signature`.

2. **Direct upload to Cloudinary** — The frontend POSTs the image file as `FormData` to `https://api.cloudinary.com/v1_1/{cloudName}/image/upload` with fields `file`, `api_key`, `timestamp`, `folder`, and `signature`. Cloudinary returns `secure_url` and `public_id`.

3. **Storage** — The frontend stores the returned `imageUrl` and `publicId` in the property's `images` array. The backend stores these in the `PropertyImage` table. On property deletion or image replacement, old Cloudinary images are deleted via `cloudinary.uploader.destroy()`.

### Image constraints

- Maximum 8 images per property (frontend limit).
- Maximum 10 images in the database schema (backend validator).
- Individual file size limit: 5 MB (frontend validation).
- Only image MIME types are accepted (frontend validation).

## Prerequisites

- Node.js (LTS recommended)
- npm (bundled with Node.js)
- A PostgreSQL database (Neon or any PostgreSQL provider)
- A Cloudinary account for image storage

## Installation and Setup

### 1. Clone the repository

```bash
cd RentHub
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure environment variables

Create a `.env` file in the `backend/` directory with the variables described below. The frontend uses `src/environments/environment.ts` for the API URL.

### 5. Set up the database

From the `backend/` directory:

```bash
npm run db:generate
npm run db:migrate
```

### 6. Start the development servers

From the `backend/` directory:

```bash
npm run dev
```

From the `frontend/` directory:

```bash
npm start
```

The backend runs on `http://localhost:5000` by default. The frontend runs on `http://localhost:4200` by default.

## Environment Variables

Create a `.env` file in the `backend/` directory. Do not commit this file.

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment (`development` or `production`) | `development` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:4200` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `DIRECT_URL` | Direct PostgreSQL connection string (for migrations) | `postgresql://...` |
| `JWT_SECRET` | Secret for signing JWTs (min 32 characters) | — |
| `JWT_EXPIRES_IN` | JWT expiry duration | `1d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | — |
| `CLOUDINARY_API_KEY` | Cloudinary API key | — |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | — |
| `CLOUDINARY_FOLDER` | Cloudinary upload folder | `renthub/properties` |

The frontend `src/environments/environment.ts` defines:

| Variable | Description | Default |
|----------|-------------|---------|
| `apiUrl` | Backend API base URL | `http://localhost:5000/api` |


## Running the Application

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with `--watch` for auto-restart on changes |
| `npm start` | Start production server |

### Frontend

| Command | Description |
|---------|-------------|
| `npm start` | Start development server with live reload |
| `npm run build` | Build for production |
| `npm run watch` | Build in watch mode (development) |
| `npm test` | Run Vitest unit tests |

## Building for Production

### Backend

```bash
cd backend
npm start
```

Ensure all environment variables are set in the production environment before starting.

### Frontend

```bash
cd frontend
npm run build
```

The production build outputs to `frontend/dist/` (default Angular output). The build uses the `production` configuration with output hashing and bundle size budgets.

## Testing

### Frontend

Unit tests use Vitest with jsdom:

```bash
cd frontend
npm test
```

Test files are located in `src/tests/` and `src/app/app.spec.ts`. Tests cover components (Navbar, PropertyCard, App), services (CommentService), and application setup.

### Backend

No test suite is configured for the backend (`"test": "echo \"Error: no test specified\" && exit 1"` in `backend/package.json`).
