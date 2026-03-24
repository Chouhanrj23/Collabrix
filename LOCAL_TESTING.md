# Collabrix — Local Testing Guide

> End-to-end setup and manual testing checklist for running Collabrix locally.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [1 · Neo4j Setup](#1--neo4j-setup)
3. [2 · Backend Startup](#2--backend-startup)
4. [3 · Frontend Startup](#3--frontend-startup)
5. [4 · Manual Testing Checklist](#4--manual-testing-checklist)
6. [5 · Debugging Tips](#5--debugging-tips)

---

## Prerequisites

| Tool        | Minimum Version | Check                    |
|-------------|-----------------|--------------------------|
| Java        | 21              | `java -version`          |
| Maven       | 3.9             | `mvn -version`           |
| Node.js     | 18              | `node -v`                |
| npm         | 9               | `npm -v`                 |
| Docker      | 24 *(optional)* | `docker -v`              |
| Neo4j Desktop | 1.6+ *(optional)* | — |

---

## 1 · Neo4j Setup

Neo4j must be running **before** the backend starts. The backend expects:

| Setting   | Value                    |
|-----------|--------------------------|
| Bolt URI  | `bolt://localhost:7687`  |
| Username  | `neo4j`                  |
| Password  | `collabrix123`           |

These values are defined in [collabrix-backend/src/main/resources/application.yml](collabrix-backend/src/main/resources/application.yml).

---

### Option A — Neo4j Desktop

1. Download Neo4j Desktop from https://neo4j.com/download/
2. Create a new **Local DBMS**:
   - Name: `Collabrix`
   - Password: `collabrix123`
   - Version: `5.x`
3. Click **Start** and wait for the status to turn green.
4. The Bolt connection is available at `bolt://localhost:7687` by default.

---

### Option B — Docker (recommended)

```bash
docker run -d \
  --name collabrix-neo4j \
  -p 7474:7474 \
  -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/collabrix123 \
  neo4j:5
```

**Verify the container is healthy:**

```bash
docker ps --filter "name=collabrix-neo4j"
# STATUS column should show "Up ... (healthy)" after ~20 seconds
```

**To stop / restart:**

```bash
docker stop collabrix-neo4j
docker start collabrix-neo4j
```

**To wipe data and start fresh:**

```bash
docker rm -f collabrix-neo4j
# then re-run the docker run command above
```

---

### Seed Relationships into Neo4j

The `DataSeeder` component automatically creates 10 employee nodes on first backend startup. However, the graph relationships (reporting lines, peers, etc.) must be seeded manually via Cypher.

1. Open **Neo4j Browser** at http://localhost:7474
2. Log in with `neo4j` / `collabrix123`
3. Open the file [collabrix-backend/src/main/resources/data/seed-data.cypher](collabrix-backend/src/main/resources/data/seed-data.cypher)
4. Copy the full contents and paste into the Neo4j Browser query editor
5. Press **Ctrl+Enter** (or click the play button) to run

> All statements use `MERGE` — they are idempotent and safe to re-run multiple times.

**Verify seed data was applied:**

```cypher
MATCH (e:Employee) RETURN e.name, e.designation ORDER BY e.designation;
// Should return 10 employees

MATCH ()-[r]->() RETURN type(r), count(r);
// Should return ~13 relationship records
```

---

## 2 · Backend Startup

### Start the backend

```bash
cd collabrix-backend
mvn spring-boot:run
```

On first run, Maven downloads dependencies (~2–3 min). Subsequent runs are faster.

### Expected output

```
...
INFO  com.collabrix.config.DataSeeder  : Seeded 10 employees successfully
INFO  o.s.b.w.embedded.tomcat.TomcatWebServer : Tomcat started on port(s): 8080
INFO  com.collabrix.CollabrixApplication : Started CollabrixApplication in X.XXX seconds
```

If employees already exist, you will see `Seed data present — skipping` instead.

### Verify the backend is running

```bash
curl -s http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dilip@collabrix.com","password":"Admin@123"}' | python3 -m json.tool
```

Expected response contains a `token` field.

### Configuration reference

All configuration lives in [collabrix-backend/src/main/resources/application.yml](collabrix-backend/src/main/resources/application.yml):

| Property                                  | Default value                  | Purpose                                   |
|-------------------------------------------|--------------------------------|-------------------------------------------|
| `server.port`                             | `8080`                         | HTTP port                                 |
| `spring.neo4j.uri`                        | `bolt://localhost:7687`        | Neo4j Bolt connection                     |
| `spring.neo4j.authentication.username`    | `neo4j`                        | Neo4j username                            |
| `spring.neo4j.authentication.password`    | `collabrix123`                 | Neo4j password                            |
| `collabrix.jwt.secret`                    | (64-char string)               | JWT signing key — change in production    |
| `collabrix.jwt.expiration-ms`             | `86400000` (24 h)              | Token lifetime                            |
| `collabrix.cors.allowed-origins`          | localhost:5173 etc.            | Allowed CORS origins                      |
| `logging.level.com.collabrix`             | `DEBUG`                        | Application log level                     |

No environment variables are required for local development — all defaults are pre-configured.

---

## 3 · Frontend Startup

```bash
cd collabrix-frontend
npm install          # first time only
npm run dev
```

The dev server starts at **http://localhost:5173**.

### Proxy configuration

The Vite dev server proxies all `/api/*` requests to `http://localhost:8080`, defined in [collabrix-frontend/vite.config.js](collabrix-frontend/vite.config.js):

```js
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    secure: false,
  },
},
```

No `.env` file is required. The frontend never calls the backend directly — all API traffic flows through the Vite proxy.

### Verify the frontend is running

Open http://localhost:5173 in a browser. You should see the Collabrix login page.

---

## 4 · Manual Testing Checklist

Use the seed accounts below for all tests. All passwords are `Admin@123`.

| Account               | Email                    | Designation          | Notes                              |
|-----------------------|--------------------------|----------------------|------------------------------------|
| Dilip Srinivas        | dilip@collabrix.com      | Director             | Highest level, Manager Dashboard   |
| Kratika Sharma        | kratika@collabrix.com    | Manager              | Has reportees, Manager Dashboard   |
| Raj Chouhan           | raj@collabrix.com        | Consultant           | No direct reports                  |
| Praveen Agarwal       | praveen@collabrix.com    | Consultant           | Good for peer-level tests          |
| Gagan Yadav           | gagan@collabrix.com      | Associate Consultant | Lowest level                       |

---

### Authentication

- [ ] Navigate to http://localhost:5173 — should redirect to `/login`
- [ ] Log in with `dilip@collabrix.com` / `Admin@123` — should land on Dashboard
- [ ] Manually navigate to http://localhost:5173/login while logged in — should redirect to Dashboard
- [ ] Open a private/incognito window and navigate to http://localhost:5173/dashboard — should redirect to `/login`
- [ ] Log in as `gagan@collabrix.com` — verify the "Manager Dashboard" sidebar item is **not** visible
- [ ] Log in as `kratika@collabrix.com` — verify the "Manager Dashboard" sidebar item **is** visible
- [ ] Click the logout button — should redirect to `/login` and clear the session

---

### Dashboard

- [ ] Log in as any user — verify the stat cards show non-zero values for connections and/or pending count
- [ ] Verify the Collaboration Graph loads and renders nodes
- [ ] Click any node in the graph — node detail modal should open showing name, designation, and relationship list
- [ ] Use the Search box in the graph toolbar — type a partial name and verify the dropdown shows matching nodes
- [ ] Click a search result — graph should animate to that node and flash it amber
- [ ] Click the Legend button — relationship type color legend should appear below the toolbar
- [ ] Click a node — verify Focus Mode activates (other nodes dim); click Reset to restore
- [ ] Use the Zoom In / Zoom Out / Fit buttons

---

### Connections

**Sending a request**

- [ ] Log in as `raj@collabrix.com`
- [ ] Navigate to **Add Connection**
- [ ] Search for `Gagan Yadav` by name or email
- [ ] Select a relationship type (e.g., `Peer`) and fill in the required fields
- [ ] Submit — verify a success message appears
- [ ] Navigate to **My Connections** → **Sent** tab — the new request should appear with status `PENDING`

**Approving a request**

- [ ] Log in as `gagan@collabrix.com` (the recipient)
- [ ] Navigate to **My Connections** → **Received** tab — the pending request from Raj should appear
- [ ] Click **Accept** — status should change to `APPROVED`
- [ ] Log back in as `raj@collabrix.com` and verify the connection now shows as `APPROVED` in **Sent**

**Rejecting a request**

- [ ] Log in as `raj@collabrix.com`, send another request to any other employee
- [ ] Log in as the recipient and click **Reject** on the pending request
- [ ] Verify the request shows as `REJECTED`

---

### Feedback

**Requesting feedback**

- [ ] Log in as `praveen@collabrix.com`
- [ ] Navigate to **Feedback** → **Request** tab
- [ ] Enter a colleague's email (e.g., `kratika@collabrix.com`) and an optional message
- [ ] Submit — verify a success notification

**Giving feedback**

- [ ] Log in as `kratika@collabrix.com`
- [ ] Navigate to **Feedback** → **Pending Requests** tab — the request from Praveen should appear
- [ ] Click **Give Feedback**, enter a rating (1–5) and comment, and submit
- [ ] Verify the request disappears from the Pending list

**Viewing received feedback**

- [ ] Log in as `praveen@collabrix.com`
- [ ] Navigate to **Feedback** → **Received** tab — the feedback from Kratika should appear with rating and comment
- [ ] Verify the average rating is calculated correctly

**Hierarchy rule (negative test)**

- [ ] Log in as `gagan@collabrix.com` (Associate Consultant)
- [ ] Attempt to give feedback to `kratika@collabrix.com` (Manager) — should show an error or the target should not appear in search

---

### Employees

- [ ] Log in as any user and navigate to **Employees**
- [ ] Verify the full list of 10 employees loads
- [ ] Use the search box — type `Raj` and verify only matching employees are shown
- [ ] Use the designation filter — select `Manager` and verify only Manager-level employees are listed
- [ ] Click on any employee card — the profile modal should open showing name, designation, account, and project
- [ ] Log in as `dilip@collabrix.com` (Director) and open any employee's profile — the Collaboration Graph inside the modal should load
- [ ] Log in as `gagan@collabrix.com` (Associate Consultant) and open a Manager's profile — the graph inside the modal should **not** be shown (junior cannot view senior's graph)

---

### Manager Dashboard

- [ ] Log in as `kratika@collabrix.com` (Manager)
- [ ] Navigate to **Manager Dashboard** — reportees list should show Raj and Gagan
- [ ] Click a reportee row to expand their connection details
- [ ] Any pending connection requests for Kratika's reports should appear under **Pending Approvals**
- [ ] Approve or reject a pending request — it should disappear from the list

- [ ] Log in as `dilip@collabrix.com` (Director) and verify the Manager Dashboard loads with a full view across Partners

---

## 5 · Debugging Tips

### Browser console errors

1. Open **DevTools** (F12 or Cmd+Option+I)
2. Go to the **Console** tab
3. Look for red error messages:
   - `401 Unauthorized` → session expired; log out and log back in
   - `403 Forbidden` → current user lacks the required designation for that action
   - `404 Not Found` → the resource no longer exists; refresh the page
   - `Network Error` → backend is not running; check that `mvn spring-boot:run` is active
   - `CORS` errors → Vite proxy may not be running; ensure `npm run dev` is active (not a static file server)

### Verifying API calls in the Network tab

1. Open DevTools → **Network** tab → filter by **Fetch/XHR**
2. Trigger an action (e.g., log in, load the graph)
3. Click any request that starts with `/api/` and inspect:
   - **Request Headers** — confirm `Authorization: Bearer <token>` is present on protected routes
   - **Response** — verify the JSON shape matches expectations
   - **Status code** — `200` / `201` for success; `4xx` / `5xx` indicates an error

### Backend logs

The backend logs at `DEBUG` level for `com.collabrix`. Watch the terminal running `mvn spring-boot:run` for:

```
# Successful login
DEBUG c.c.service.AuthService : Login successful for dilip@collabrix.com

# Neo4j connection failure
com.neo4j.driver.exceptions.ServiceUnavailableException: Unable to connect to bolt://localhost:7687

# JWT expiry / invalid token
DEBUG c.c.config.JwtAuthFilter : Invalid or expired JWT

# Business rule violations
c.c.exception.GlobalExceptionHandler : HierarchyViolationException: ...
```

To increase log verbosity for a specific package, edit `application.yml`:

```yaml
logging:
  level:
    com.collabrix: DEBUG
    org.springframework.security: DEBUG     # add this to trace auth issues
    org.springframework.data.neo4j: DEBUG   # add this to trace Cypher queries
```

### Neo4j Browser (http://localhost:7474)

Use the Neo4j Browser to inspect raw graph data when the UI shows unexpected results.

**Useful Cypher queries:**

```cypher
-- All employees
MATCH (e:Employee) RETURN e.name, e.designation, e.email ORDER BY e.designation;

-- All relationships
MATCH (a:Employee)-[r]->(b:Employee)
RETURN a.name, type(r), b.name;

-- Pending connection requests
MATCH (c:ConnectionRequest {status: 'PENDING'})
RETURN c.id, c.fromEmployeeId, c.toEmployeeId, c.relationshipType;

-- All feedback
MATCH (f:Feedback)
RETURN f.fromEmployeeId, f.toEmployeeId, f.rating, f.comment;

-- Clear all connection requests (test reset)
MATCH (c:ConnectionRequest) DETACH DELETE c;

-- Clear all feedback (test reset)
MATCH (f:Feedback) DETACH DELETE f;
MATCH (fr:FeedbackRequest) DETACH DELETE fr;
```

### Common startup issues

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Connection refused: bolt://localhost:7687` | Neo4j is not running | Start Neo4j Desktop or the Docker container |
| `401` on every API call | Token missing or expired | Log out and log back in |
| Graph shows no edges | Cypher seed not run | Run `seed-data.cypher` in Neo4j Browser |
| `npm run dev` — port 5173 already in use | Another Vite process is running | Kill the old process: `lsof -ti:5173 \| xargs kill` |
| `mvn spring-boot:run` fails with `Java version` error | Wrong Java version active | Run `java -version`; ensure Java 21 is selected |
| Page shows "Loading…" indefinitely | Backend not running or proxy failing | Check `mvn spring-boot:run` terminal; verify `curl http://localhost:8080/api/auth/login` works |
