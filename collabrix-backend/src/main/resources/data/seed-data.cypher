// ============================================================
// Collabrix Seed Data — run in Neo4j Browser / cypher-shell
// All MERGE statements are idempotent (safe to re-run)
// ============================================================

// --- Constraints ---
CREATE CONSTRAINT emp_email IF NOT EXISTS FOR (e:Employee) REQUIRE e.email IS UNIQUE;

// --- Relationships ---
MATCH (a:Employee {email: 'sankara@collabrix.com'}), (b:Employee {email: 'dilip@collabrix.com'})
MERGE (a)-[:REPORTING_PARTNER {since: '2017-08-15'}]->(b)
MERGE (cr1:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_PARTNER'})
ON CREATE SET cr1.id = randomUUID(), cr1.status = 'APPROVED', cr1.startDate = date('2017-08-15'), cr1.endDate = date('2024-03-26'), cr1.project = 'INTERNAL';

MATCH (a:Employee {email: 'malli@collabrix.com'}), (b:Employee {email: 'dilip@collabrix.com'})
MERGE (a)-[:REPORTING_PARTNER {since: '2018-01-10'}]->(b)
MERGE (cr2:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_PARTNER'})
ON CREATE SET cr2.id = randomUUID(), cr2.status = 'APPROVED', cr2.startDate = date('2018-01-10'), cr2.endDate = date('2024-03-26'), cr2.project = 'INTERNAL';

MATCH (a:Employee {email: 'kratika@collabrix.com'}), (b:Employee {email: 'sankara@collabrix.com'})
MERGE (a)-[:REPORTING_MANAGER {since: '2019-03-20'}]->(b)
MERGE (cr3:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_MANAGER'})
ON CREATE SET cr3.id = randomUUID(), cr3.status = 'APPROVED', cr3.project = 'INTERNAL';

MATCH (a:Employee {email: 'karthik@collabrix.com'}), (b:Employee {email: 'malli@collabrix.com'})
MERGE (a)-[:REPORTING_MANAGER {since: '2019-07-01'}]->(b)
MERGE (cr4:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_MANAGER'})
ON CREATE SET cr4.id = randomUUID(), cr4.status = 'APPROVED', cr4.project = 'INTERNAL';

MATCH (a:Employee {email: 'hiren@collabrix.com'}), (b:Employee {email: 'sankara@collabrix.com'})
MERGE (a)-[:ENGAGEMENT_MANAGER {since: '2020-02-14', department: 'Software Engineering'}]->(b)
MERGE (cr5:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'ENGAGEMENT_MANAGER'})
ON CREATE SET cr5.id = randomUUID(), cr5.status = 'APPROVED', cr5.department = 'Software Engineering', cr5.project = 'INTERNAL';

MATCH (a:Employee {email: 'raj@collabrix.com'}), (b:Employee {email: 'kratika@collabrix.com'})
MERGE (a)-[:REPORTING_MANAGER {since: '2021-06-01'}]->(b)
MERGE (cr6:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_MANAGER'})
ON CREATE SET cr6.id = randomUUID(), cr6.status = 'APPROVED', cr6.project = 'INTERNAL';

MATCH (a:Employee {email: 'praveen@collabrix.com'}), (b:Employee {email: 'karthik@collabrix.com'})
MERGE (a)-[:ENGAGEMENT_MANAGER {since: '2021-09-15'}]->(b)
MERGE (cr7:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'ENGAGEMENT_MANAGER'})
ON CREATE SET cr7.id = randomUUID(), cr7.status = 'APPROVED', cr7.project = 'INTERNAL';



MATCH (a:Employee {email: 'gagan@collabrix.com'}), (b:Employee {email: 'kratika@collabrix.com'})
MERGE (a)-[:REPORTING_MANAGER {since: '2023-08-21'}]->(b)
MERGE (cr9:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_MANAGER'})
ON CREATE SET cr9.id = randomUUID(), cr9.status = 'APPROVED', cr9.project = 'INTERNAL';

MATCH (a:Employee {email: 'raj@collabrix.com'}), (b:Employee {email: 'praveen@collabrix.com'})
MERGE (a)-[:PEER {since: '2022-01-01'}]->(b)
MERGE (cr10:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'PEER'})
ON CREATE SET cr10.id = randomUUID(), cr10.status = 'APPROVED', cr10.project = 'INTERNAL';





MATCH (a:Employee {email: 'sankara@collabrix.com'}), (b:Employee {email: 'dilip@collabrix.com'})
MERGE (a)-[:ENGAGEMENT_PARTNER {since: '2020-06-01', department: 'Software Engineering'}]->(b)
MERGE (cr13:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'ENGAGEMENT_PARTNER'})
ON CREATE SET cr13.id = randomUUID(), cr13.status = 'APPROVED', cr13.department = 'Software Engineering', cr13.project = 'INTERNAL';

MATCH (a:Employee {email: 'ganesh@collabrix.com'}), (b:Employee {email: 'kratika@collabrix.com'})
MERGE (a)-[:REPORTING_MANAGER {since: '2024-01-15'}]->(b)
MERGE (cr14:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_MANAGER'})
ON CREATE SET cr14.id = randomUUID(), cr14.status = 'APPROVED', cr14.project = 'AI in SDLC';

MATCH (a:Employee {email: 'ganesh@collabrix.com'}), (b:Employee {email: 'hiren@collabrix.com'})
MERGE (a)-[:ENGAGEMENT_MANAGER {since: '2024-01-15'}]->(b)
MERGE (cr15:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'ENGAGEMENT_MANAGER'})
ON CREATE SET cr15.id = randomUUID(), cr15.status = 'APPROVED', cr15.project = 'AI in SDLC';

// --- Project Nodes ---
MERGE (:Project {name: 'AI in SDLC'});
MERGE (:Project {name: 'Banking'});
MERGE (:Project {name: 'Internal'});
MERGE (:Project {name: 'Digital Transformation'});
MERGE (:Project {name: 'Cloud Migration'});

// --- Update ConnectionRequest fields (account, project, department, startDate, createdAt, resolvedAt) ---
MATCH (a:Employee {email: 'sankara@collabrix.com'}), (b:Employee {email: 'dilip@collabrix.com'})
MATCH (cr:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_PARTNER'})
SET cr.account = 'Pinnacle Banking', cr.project = 'Digital Transformation',
    cr.department = 'Software Engineering',
    cr.startDate = date('2017-08-15'), cr.endDate = date('2024-03-26'),
    cr.createdAt = datetime('2017-08-15T09:00:00'), cr.resolvedAt = datetime('2017-08-15T09:00:00');

MATCH (a:Employee {email: 'malli@collabrix.com'}), (b:Employee {email: 'dilip@collabrix.com'})
MATCH (cr:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_PARTNER'})
SET cr.account = 'TechVision Corp', cr.project = 'Cloud Migration',
    cr.department = 'Software Engineering',
    cr.startDate = date('2018-01-10'), cr.endDate = date('2024-03-26'),
    cr.createdAt = datetime('2018-01-10T09:00:00'), cr.resolvedAt = datetime('2018-01-10T09:00:00');

MATCH (a:Employee {email: 'kratika@collabrix.com'}), (b:Employee {email: 'sankara@collabrix.com'})
MATCH (cr:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_MANAGER'})
SET cr.account = 'Pinnacle Banking', cr.project = 'AI in SDLC',
    cr.department = 'Software Engineering',
    cr.startDate = date('2019-03-20'),
    cr.createdAt = datetime('2019-03-20T09:00:00'), cr.resolvedAt = datetime('2019-03-20T09:00:00');

MATCH (a:Employee {email: 'karthik@collabrix.com'}), (b:Employee {email: 'malli@collabrix.com'})
MATCH (cr:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_MANAGER'})
SET cr.account = 'TechVision Corp', cr.project = 'Cloud Migration',
    cr.department = 'Software Engineering',
    cr.startDate = date('2019-07-01'),
    cr.createdAt = datetime('2019-07-01T09:00:00'), cr.resolvedAt = datetime('2019-07-01T09:00:00');

MATCH (a:Employee {email: 'hiren@collabrix.com'}), (b:Employee {email: 'sankara@collabrix.com'})
MATCH (cr:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'ENGAGEMENT_MANAGER'})
SET cr.account = 'Pinnacle Banking', cr.project = 'AI in SDLC',
    cr.department = 'Software Engineering',
    cr.startDate = date('2020-02-14'),
    cr.createdAt = datetime('2020-02-14T09:00:00'), cr.resolvedAt = datetime('2020-02-14T09:00:00');

MATCH (a:Employee {email: 'raj@collabrix.com'}), (b:Employee {email: 'kratika@collabrix.com'})
MATCH (cr:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_MANAGER'})
SET cr.account = 'Pinnacle Banking', cr.project = 'AI in SDLC, Banking',
    cr.department = 'Software Engineering',
    cr.startDate = date('2021-06-01'),
    cr.createdAt = datetime('2021-06-01T09:00:00'), cr.resolvedAt = datetime('2021-06-01T09:00:00');

MATCH (a:Employee {email: 'praveen@collabrix.com'}), (b:Employee {email: 'karthik@collabrix.com'})
MATCH (cr:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'ENGAGEMENT_MANAGER'})
SET cr.account = 'TechVision Corp', cr.project = 'Cloud Migration',
    cr.department = 'Software Engineering',
    cr.startDate = date('2021-09-15'),
    cr.createdAt = datetime('2021-09-15T09:00:00'), cr.resolvedAt = datetime('2021-09-15T09:00:00');

MATCH (a:Employee {email: 'gagan@collabrix.com'}), (b:Employee {email: 'kratika@collabrix.com'})
MATCH (cr:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_MANAGER'})
SET cr.account = 'Pinnacle Banking', cr.project = 'AI in SDLC',
    cr.department = 'Software Engineering',
    cr.startDate = date('2023-08-21'),
    cr.createdAt = datetime('2023-08-21T09:00:00'), cr.resolvedAt = datetime('2023-08-21T09:00:00');

MATCH (a:Employee {email: 'raj@collabrix.com'}), (b:Employee {email: 'praveen@collabrix.com'})
MATCH (cr:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'PEER'})
SET cr.account = 'Pinnacle Banking', cr.project = 'AI in SDLC, Banking',
    cr.department = 'Software Engineering',
    cr.startDate = date('2022-01-01'),
    cr.createdAt = datetime('2022-01-01T09:00:00'), cr.resolvedAt = datetime('2022-01-01T09:00:00');

MATCH (a:Employee {email: 'sankara@collabrix.com'}), (b:Employee {email: 'dilip@collabrix.com'})
MATCH (cr:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'ENGAGEMENT_PARTNER'})
SET cr.account = 'Pinnacle Banking', cr.project = 'Digital Transformation',
    cr.department = 'Software Engineering',
    cr.startDate = date('2020-06-01'),
    cr.createdAt = datetime('2020-06-01T09:00:00'), cr.resolvedAt = datetime('2020-06-01T09:00:00');

MATCH (a:Employee {email: 'ganesh@collabrix.com'}), (b:Employee {email: 'kratika@collabrix.com'})
MATCH (cr:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_MANAGER'})
SET cr.account = 'Pinnacle Banking', cr.project = 'AI in SDLC',
    cr.department = 'Software Engineering',
    cr.startDate = date('2024-01-15'),
    cr.createdAt = datetime('2024-01-15T09:00:00'), cr.resolvedAt = datetime('2024-01-15T09:00:00');

MATCH (a:Employee {email: 'ganesh@collabrix.com'}), (b:Employee {email: 'hiren@collabrix.com'})
MATCH (cr:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'ENGAGEMENT_MANAGER'})
SET cr.account = 'Pinnacle Banking', cr.project = 'AI in SDLC',
    cr.department = 'Software Engineering',
    cr.startDate = date('2024-01-15'),
    cr.createdAt = datetime('2024-01-15T09:00:00'), cr.resolvedAt = datetime('2024-01-15T09:00:00');

// --- Feedback ---
MATCH (sender1:Employee {email: 'kratika@collabrix.com'}), (receiver1:Employee {email: 'raj@collabrix.com'})
MERGE (f1:Feedback {
    fromEmployeeId: id(sender1),
    toEmployeeId:   id(receiver1),
    rating:          5,
    comment:         'Raj demonstrates strong ownership.',
    feedbackDate:    date('2024-10-15'),
    isResponse:      false
});

MATCH (sender2:Employee {email: 'karthik@collabrix.com'}), (receiver2:Employee {email: 'praveen@collabrix.com'})
MERGE (f2:Feedback {
    fromEmployeeId: id(sender2),
    toEmployeeId:   id(receiver2),
    rating:          4,
    comment:         'Praveen is a reliable team player.',
    feedbackDate:    date('2024-11-02'),
    isResponse:      false
});

MATCH (sender3:Employee {email: 'sankara@collabrix.com'}), (receiver3:Employee {email: 'kratika@collabrix.com'})
MERGE (f3:Feedback {
    fromEmployeeId: id(sender3),
    toEmployeeId:   id(receiver3),
    rating:          5,
    comment:         'Kratika manages her team effectively.',
    feedbackDate:    date('2024-12-01'),
    isResponse:      false
});

