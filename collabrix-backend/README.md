# Collabrix Backend

Backend API for the Collabrix platform — a professional relationship and feedback management system built on a graph database.

## Tech Stack

| Technology        | Version |
|-------------------|---------|
| Java              | 21      |
| Spring Boot       | 3.2.0   |
| Spring Security   | 6.x     |
| Spring Data Neo4j | 7.x     |
| Neo4j             | 5.x     |
| JWT (jjwt)        | 0.12.3  |
| Maven             | 3.9+    |
| Lombok            | Latest  |
| Docker            | 24+     |

## Getting Started

### Prerequisites

- Java 21+
- Maven 3.9+
- Neo4j 5.x running on `bolt://localhost:7687`

### Run Locally

1. **Start Neo4j** (local install or Docker):
   ```bash
   docker run -d --name neo4j -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/collabrix123 neo4j:5
   ```

2. **Start the backend**:
   ```bash
   cd collabrix-backend
   mvn spring-boot:run
   ```

3. **Seed relationships** — open Neo4j Browser at `http://localhost:7474` and run the contents of `src/main/resources/data/seed-data.cypher`.

The server starts on `http://localhost:8080`. The `DataSeeder` component automatically creates 10 employees on first startup.

### Run with Docker Compose

```bash
cd collabrix-backend
docker-compose up --build
```

This starts Neo4j and the backend together. The backend waits for Neo4j to be healthy before starting.

## Authentication

All endpoints except `POST /api/auth/login` require a JWT token.

**Header format:**
```
Authorization: Bearer <token>
```

## API Endpoints

### Auth (`/api/auth`)

| Method | Path              | Auth | Request Body                          | Response                                      |
|--------|-------------------|------|---------------------------------------|-----------------------------------------------|
| POST   | `/api/auth/login` | No   | `{ email, password }`                 | `{ token, employeeId, username, name, designation, grade, expiresIn }` |
| GET    | `/api/auth/me`    | JWT  | —                                     | `{ id, username, name, email, designation, grade, account, project, joiningDate }` |

### Employees (`/api/employees`)

| Method | Path                        | Auth | Request Body | Response                     |
|--------|-----------------------------|------|--------------|------------------------------|
| GET    | `/api/employees`            | JWT  | —            | `EmployeeDto[]`              |
| GET    | `/api/employees/{id}`       | JWT  | —            | `EmployeeDto`                |
| GET    | `/api/employees/accounts`   | JWT  | —            | `String[]` (distinct accounts) |
| GET    | `/api/employees/{id}/reportees` | JWT | —         | `EmployeeDto[]`              |
| GET    | `/api/employees/search?q=`  | JWT  | —            | `EmployeeDto[]` (max 10)     |

### Connections (`/api/connections`)

| Method | Path                            | Auth | Request Body                                                         | Response                        |
|--------|---------------------------------|------|----------------------------------------------------------------------|---------------------------------|
| POST   | `/api/connections/request`      | JWT  | `{ targetEmail, relationshipType, account, project, duration }`      | `ConnectionRequestResponseDto`  |
| PUT    | `/api/connections/approve/{id}` | JWT  | —                                                                    | `ConnectionRequestResponseDto`  |
| PUT    | `/api/connections/reject/{id}`  | JWT  | —                                                                    | `ConnectionRequestResponseDto`  |
| GET    | `/api/connections/pending`      | JWT  | —                                                                    | `ConnectionRequestResponseDto[]`|
| GET    | `/api/connections/my`           | JWT  | —                                                                    | `ConnectionRequestResponseDto[]`|
| GET    | `/api/connections/employee/{id}`| JWT  | — (senior access only)                                               | `ConnectionRequestResponseDto[]`|

### Feedback (`/api/feedback`)

| Method | Path                            | Auth | Request Body                                            | Response          |
|--------|---------------------------------|------|---------------------------------------------------------|-------------------|
| POST   | `/api/feedback/give`            | JWT  | `{ toEmployeeId, rating (1-5), comment, requestId? }`  | `FeedbackDto`     |
| POST   | `/api/feedback/request`         | JWT  | `{ requestFromEmail, message? }`                        | `200 OK`          |
| GET    | `/api/feedback/received`        | JWT  | —                                                       | `FeedbackDto[]`   |
| GET    | `/api/feedback/pending-requests`| JWT  | —                                                       | `FeedbackDto[]`   |

### Graph (`/api/graph`)

| Method | Path                          | Auth | Request Body                  | Response             |
|--------|-------------------------------|------|-------------------------------|----------------------|
| GET    | `/api/graph/me`               | JWT  | —                             | `{ nodes[], edges[] }` |
| GET    | `/api/graph/employee/{id}`    | JWT  | — (senior access only)        | `{ nodes[], edges[] }` |
| GET    | `/api/graph/manager-dashboard`| JWT  | —                             | `{ reportees[], pendingApprovals[], totalConnections }` |

## Relationship Types

| Enum Value                     | Display Name                  |
|--------------------------------|-------------------------------|
| `REPORTING_PARTNER`            | Reporting Partner             |
| `ENGAGEMENT_PARTNER`           | Engagement Partner            |
| `REPORTING_MANAGER`            | Reporting Manager             |
| `ENGAGEMENT_MANAGER`           | Engagement Manager            |
| `INTERNAL_PRODUCT_DEVELOPMENT` | Internal Product Development  |
| `PEER`                         | Peer                          |
| `OTHERS`                       | Others                        |

## Node Colours (vis.js)

| Designation            | Hex Code  | Colour  |
|------------------------|-----------|---------|
| Director               | `#8E44AD` | Purple  |
| Partner                | `#F39C12` | Orange  |
| Manager                | `#2E86C1` | Blue    |
| Senior Consultant      | `#16A085` | Teal    |
| Consultant             | `#27AE60` | Green   |
| Associate Consultant   | `#E74C3C` | Red     |

## Seed Users

All users share the password **`Admin@123`**.

| Username  | Email                    | Designation            | Account            |
|-----------|--------------------------|------------------------|--------------------|
| dilip     | dilip@collabrix.com      | Director               | Collabrix Internal |
| sankara   | sankara@collabrix.com    | Partner                | TechCorp India     |
| malli     | malli@collabrix.com      | Partner                | FinServ Ltd        |
| kratika   | kratika@collabrix.com    | Manager                | TechCorp India     |
| karthik   | karthik@collabrix.com    | Manager                | FinServ Ltd        |
| hiren     | hiren@collabrix.com      | Manager                | RetailX            |
| raj       | raj@collabrix.com        | Consultant             | TechCorp India     |
| praveen   | praveen@collabrix.com    | Consultant             | FinServ Ltd        |
| neha      | neha@collabrix.com       | Senior Consultant      | RetailX            |
| gagan     | gagan@collabrix.com      | Associate Consultant   | TechCorp India     |

## Hierarchy Rules

- **Feedback**: You can only give feedback to employees at your level or below.
- **Connections**: Senior employees can view connections of junior employees.
- **Graph**: You can only view the graph of employees junior to you.
