// ============================================================
// Collabrix Seed Data — run in Neo4j Browser / cypher-shell
// All MERGE statements are idempotent (safe to re-run)
// ============================================================

// --- Constraints ---
CREATE CONSTRAINT emp_id IF NOT EXISTS FOR (e:Employee) REQUIRE e.id IS UNIQUE;
CREATE CONSTRAINT emp_email IF NOT EXISTS FOR (e:Employee) REQUIRE e.email IS UNIQUE;

// --- Employees ---
// Password "Admin@123" hashed with BCrypt strength 12
MERGE (e:Employee {id: 'emp-001'})
SET e.username    = 'dilip',
    e.name        = 'Dilip Srinivas',
    e.email       = 'dilip@collabrix.com',
    e.passwordHash = '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9y',
    e.designation = 'DIRECTOR',
    e.grade       = 'SENIOR',
    e.account     = 'Collabrix Internal',
    e.project     = 'Firm Leadership',
    e.joiningDate = date('2016-04-01'),
    e.active      = true;

MERGE (e:Employee {id: 'emp-002'})
SET e.username    = 'sankara',
    e.name        = 'T Sankara Subramanian',
    e.email       = 'sankara@collabrix.com',
    e.passwordHash = '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9y',
    e.designation = 'PARTNER',
    e.grade       = 'SENIOR',
    e.account     = 'TechCorp India',
    e.project     = 'ERP Modernisation',
    e.joiningDate = date('2017-08-15'),
    e.active      = true;

MERGE (e:Employee {id: 'emp-003'})
SET e.username    = 'malli',
    e.name        = 'Mallikarjun Kandkuru',
    e.email       = 'malli@collabrix.com',
    e.passwordHash = '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9y',
    e.designation = 'PARTNER',
    e.grade       = 'SENIOR',
    e.account     = 'FinServ Ltd',
    e.project     = 'Risk Analytics Platform',
    e.joiningDate = date('2018-01-10'),
    e.active      = true;

MERGE (e:Employee {id: 'emp-004'})
SET e.username    = 'kratika',
    e.name        = 'Kratika Sharma',
    e.email       = 'kratika@collabrix.com',
    e.passwordHash = '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9y',
    e.designation = 'MANAGER',
    e.grade       = 'SENIOR',
    e.account     = 'TechCorp India',
    e.project     = 'ERP Modernisation',
    e.joiningDate = date('2019-03-20'),
    e.active      = true;

MERGE (e:Employee {id: 'emp-005'})
SET e.username    = 'karthik',
    e.name        = 'Karthik Pai',
    e.email       = 'karthik@collabrix.com',
    e.passwordHash = '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9y',
    e.designation = 'MANAGER',
    e.grade       = 'SENIOR',
    e.account     = 'FinServ Ltd',
    e.project     = 'Risk Analytics Platform',
    e.joiningDate = date('2019-07-01'),
    e.active      = true;

MERGE (e:Employee {id: 'emp-006'})
SET e.username    = 'hiren',
    e.name        = 'Hiren Shah',
    e.email       = 'hiren@collabrix.com',
    e.passwordHash = '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9y',
    e.designation = 'MANAGER',
    e.grade       = 'SENIOR',
    e.account     = 'RetailX',
    e.project     = 'Digital Commerce',
    e.joiningDate = date('2020-02-14'),
    e.active      = true;

MERGE (e:Employee {id: 'emp-007'})
SET e.username    = 'raj',
    e.name        = 'Raj Chouhan',
    e.email       = 'raj@collabrix.com',
    e.passwordHash = '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9y',
    e.designation = 'CONSULTANT',
    e.grade       = 'JUNIOR',
    e.account     = 'TechCorp India',
    e.project     = 'ERP Modernisation',
    e.joiningDate = date('2021-06-01'),
    e.active      = true;

MERGE (e:Employee {id: 'emp-008'})
SET e.username    = 'praveen',
    e.name        = 'Praveen Agarwal',
    e.email       = 'praveen@collabrix.com',
    e.passwordHash = '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9y',
    e.designation = 'CONSULTANT',
    e.grade       = 'JUNIOR',
    e.account     = 'FinServ Ltd',
    e.project     = 'Risk Analytics Platform',
    e.joiningDate = date('2021-09-15'),
    e.active      = true;

MERGE (e:Employee {id: 'emp-009'})
SET e.username    = 'neha',
    e.name        = 'Neha Gupta',
    e.email       = 'neha@collabrix.com',
    e.passwordHash = '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9y',
    e.designation = 'SENIOR_CONSULTANT',
    e.grade       = 'JUNIOR',
    e.account     = 'RetailX',
    e.project     = 'Digital Commerce',
    e.joiningDate = date('2022-03-07'),
    e.active      = true;

MERGE (e:Employee {id: 'emp-010'})
SET e.username    = 'gagan',
    e.name        = 'Gagan Yadav',
    e.email       = 'gagan@collabrix.com',
    e.passwordHash = '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9y',
    e.designation = 'ASSOCIATE_CONSULTANT',
    e.grade       = 'JUNIOR',
    e.account     = 'TechCorp India',
    e.project     = 'ERP Modernisation',
    e.joiningDate = date('2023-08-21'),
    e.active      = true;

// --- Relationships ---
MATCH (a:Employee {id: 'emp-002'}), (b:Employee {id: 'emp-001'})
MERGE (a)-[:REPORTING_PARTNER {since: '2017-08-15'}]->(b);

MATCH (a:Employee {id: 'emp-003'}), (b:Employee {id: 'emp-001'})
MERGE (a)-[:REPORTING_PARTNER {since: '2018-01-10'}]->(b);

MATCH (a:Employee {id: 'emp-004'}), (b:Employee {id: 'emp-002'})
MERGE (a)-[:REPORTING_MANAGER {since: '2019-03-20'}]->(b);

MATCH (a:Employee {id: 'emp-005'}), (b:Employee {id: 'emp-003'})
MERGE (a)-[:REPORTING_MANAGER {since: '2019-07-01'}]->(b);

MATCH (a:Employee {id: 'emp-006'}), (b:Employee {id: 'emp-002'})
MERGE (a)-[:ENGAGEMENT_MANAGER {since: '2020-02-14', account: 'RetailX'}]->(b);

MATCH (a:Employee {id: 'emp-007'}), (b:Employee {id: 'emp-004'})
MERGE (a)-[:REPORTING_MANAGER {since: '2021-06-01'}]->(b);

MATCH (a:Employee {id: 'emp-008'}), (b:Employee {id: 'emp-005'})
MERGE (a)-[:REPORTING_MANAGER {since: '2021-09-15'}]->(b);

MATCH (a:Employee {id: 'emp-009'}), (b:Employee {id: 'emp-006'})
MERGE (a)-[:REPORTING_MANAGER {since: '2022-03-07'}]->(b);

MATCH (a:Employee {id: 'emp-010'}), (b:Employee {id: 'emp-004'})
MERGE (a)-[:REPORTING_MANAGER {since: '2023-08-21'}]->(b);

MATCH (a:Employee {id: 'emp-007'}), (b:Employee {id: 'emp-008'})
MERGE (a)-[:PEER {since: '2022-01-01', project: 'ERP Modernisation'}]->(b);

MATCH (a:Employee {id: 'emp-009'}), (b:Employee {id: 'emp-010'})
MERGE (a)-[:PEER {since: '2023-09-01', project: 'Digital Commerce'}]->(b);

MATCH (a:Employee {id: 'emp-007'}), (b:Employee {id: 'emp-009'})
MERGE (a)-[:INTERNAL_PRODUCT_DEVELOPMENT {since: '2023-01-15', project: 'Collabrix Platform'}]->(b);

MATCH (a:Employee {id: 'emp-002'}), (b:Employee {id: 'emp-001'})
MERGE (a)-[:ENGAGEMENT_PARTNER {since: '2020-06-01', account: 'RetailX'}]->(b);

// --- Feedback ---
MERGE (f:Feedback {id: 'fb-001'})
SET f.fromEmployeeId = 'emp-004',
    f.toEmployeeId   = 'emp-007',
    f.rating          = 5,
    f.comment         = 'Raj demonstrates strong ownership.',
    f.feedbackDate    = date('2024-10-15'),
    f.isResponse      = false;

MERGE (f:Feedback {id: 'fb-002'})
SET f.fromEmployeeId = 'emp-005',
    f.toEmployeeId   = 'emp-008',
    f.rating          = 4,
    f.comment         = 'Praveen is a reliable team player.',
    f.feedbackDate    = date('2024-11-02'),
    f.isResponse      = false;

MERGE (f:Feedback {id: 'fb-003'})
SET f.fromEmployeeId = 'emp-002',
    f.toEmployeeId   = 'emp-004',
    f.rating          = 5,
    f.comment         = 'Kratika manages her team effectively.',
    f.feedbackDate    = date('2024-12-01'),
    f.isResponse      = false;
