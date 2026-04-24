# InnoHire Platform

InnoHire is a modern hiring and requisition management platform. It consists of a **React Frontend** and a **Java Spring Boot Backend**, communicating via RESTful APIs with JWT authentication. 

---

## Architecture Overview

**Frontend:**
- **Framework:** React + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn-ui
- **State/Data:** React hooks with `axios` referencing our custom backend (`src/api/client.ts`).

**Backend:**
- **Framework:** Java Spring Boot 3+
- **Language:** Java 17+
- **Database:** PostgreSQL (via Spring Data JPA / Hibernate)
- **Security:** Custom JWT Authentication with Spring Security filter chains.

> **Note to Developers:** This project was originally built using Supabase (BaaS) and has since been fully migrated to a custom Spring Boot architecture. All `@supabase/supabase-js` references have been successfully stripped from the codebase and replaced with API calls pointing to `/api/v1`.

---

## 🚀 Running the Project Locally

### 1. Database Setup
1. Install [PostgreSQL](https://www.postgresql.org/download/).
2. Create a new local database named `innohire`.
3. Update the database credentials in `backend/src/main/resources/application.properties` if they differ from the default (`postgres`/`postgres`).

### 2. Backend (Java Spring Boot)
1. Ensure **Java 17+** is installed on your machine.
2. Navigate to the backend directory:
   ```bash
   cd inno-hire-flow/backend
   ```
3. Run the application:
   ```bash
   # Windows
   .\mvnw.cmd spring-boot:run
   
   # Mac/Linux
   ./mvnw spring-boot:run
   ```
   *Spring Data JPA is configured to `update` the schema on boot (see `spring.jpa.hibernate.ddl-auto=update`). The necessary tables will generate automatically when the application starts.*

### 3. Frontend (React)
1. Ensure **Bun** or **Node.js** is installed.
2. Navigate to the frontend directory (root):
   ```bash
   cd inno-hire-flow/
   ```
3. Install dependencies:
   ```bash
   bun install  # or npm install
   ```
4. Start the Vite development server:
   ```bash
   bun run dev  # or npm run dev
   ```

---

## 📌 Backend Developer Guide

If you are a Java Developer taking over this repository, here is what you need to know:

### Domain Context
The application revolves around core hiring entities:
1. **Profile**: Users of the system (Hiring Managers, LOB Heads, etc).
2. **Requisition**: Job openings requested by hiring managers.
3. **Offer**: Candidate offers tied to a requisition.
4. **Notification**: System alerts for users.
5. **ProjectCode**: Billing/project identifiers for requisitions.

### Where things are located:
- **`model/`**: Contains all JPA Entities (e.g., `Profile.java`, `Requisition.java`, `Offer.java`). Note the use of `@JdbcTypeCode(SqlTypes.JSON)` for handling JSONB fields previously used in Supabase.
- **`repository/`**: Standard Spring Data JpaRepositories for database operations.
- **`security/`**: Defines the stateless JWT authentication system (`JwtUtil`, `JwtAuthFilter`, `SecurityConfig`). Local login and registration generates a JWT here.
- **`service/`**: Business logic, including standard entity managers and the `EmailNotificationService` which replaces legacy Supabase Edge Functions.
- **`controller/`**: Fully decoupled REST Endpoints consumed directly by the React frontend (`/api/v1/...`).

### Security Protocol
The system does not use sessions. Every frontend request is intercepted by the `JwtAuthFilter`. You must pass the Authorization header:
`Authorization: Bearer <token>`
If you wish to test protected endpoints in Postman, hit `/api/v1/auth/register` or `/api/v1/auth/authenticate` first to get your token!

### Next Implementation Steps / Roadmap
- **Validations:** Add robust `@Valid` annotations to controller DTOs.
- **Roles & Permissions:** Transition UI application roles (`hiring-manager`, `lob-head`) into Spring Security `@PreAuthorize("hasRole('...')")` blocks on specific controller endpoints.
- **WebSockets:** The frontend previously used Supabase Realtime subscriptions for notifications. This was disabled locally. Future architecture will require integrating Spring WebSockets (STOMP) for realtime push notifications, or relying purely on polling. 
- **Tests:** Add JUnit coverage for the Service logic!
- **SMTP Setup:** Complete email dispatch inside `EmailNotificationService` (set SMTP credentials in `application.properties`).
- **File Uploads (Avatars):** The mock migration accepts base64 strings to `/api/v1/profiles/{id}/avatar`. Implement proper S3/Disk file uploads and return public URLs for better performance.
- **Invitations:** Fully hook up `UUID` token workflows to safely manage pending user invitations via emails.
