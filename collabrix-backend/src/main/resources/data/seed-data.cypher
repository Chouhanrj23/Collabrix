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
ON CREATE SET cr1.id = randomUUID(), cr1.status = 'APPROVED', cr1.duration = 'since 2017-08-15';

MATCH (a:Employee {email: 'malli@collabrix.com'}), (b:Employee {email: 'dilip@collabrix.com'})
MERGE (a)-[:REPORTING_PARTNER {since: '2018-01-10'}]->(b)
MERGE (cr2:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_PARTNER'})
ON CREATE SET cr2.id = randomUUID(), cr2.status = 'APPROVED', cr2.duration = 'since 2018-01-10';

MATCH (a:Employee {email: 'kratika@collabrix.com'}), (b:Employee {email: 'sankara@collabrix.com'})
MERGE (a)-[:REPORTING_MANAGER {since: '2019-03-20'}]->(b)
MERGE (cr3:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_MANAGER'})
ON CREATE SET cr3.id = randomUUID(), cr3.status = 'APPROVED', cr3.duration = 'since 2019-03-20';

MATCH (a:Employee {email: 'karthik@collabrix.com'}), (b:Employee {email: 'malli@collabrix.com'})
MERGE (a)-[:REPORTING_MANAGER {since: '2019-07-01'}]->(b)
MERGE (cr4:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_MANAGER'})
ON CREATE SET cr4.id = randomUUID(), cr4.status = 'APPROVED', cr4.duration = 'since 2019-07-01';

MATCH (a:Employee {email: 'hiren@collabrix.com'}), (b:Employee {email: 'sankara@collabrix.com'})
MERGE (a)-[:ENGAGEMENT_MANAGER {since: '2020-02-14', account: 'RetailX'}]->(b)
MERGE (cr5:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'ENGAGEMENT_MANAGER'})
ON CREATE SET cr5.id = randomUUID(), cr5.status = 'APPROVED', cr5.duration = 'since 2020-02-14', cr5.account = 'RetailX';

MATCH (a:Employee {email: 'raj@collabrix.com'}), (b:Employee {email: 'kratika@collabrix.com'})
MERGE (a)-[:REPORTING_MANAGER {since: '2021-06-01'}]->(b)
MERGE (cr6:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_MANAGER'})
ON CREATE SET cr6.id = randomUUID(), cr6.status = 'APPROVED', cr6.duration = 'since 2021-06-01';

MATCH (a:Employee {email: 'praveen@collabrix.com'}), (b:Employee {email: 'karthik@collabrix.com'})
MERGE (a)-[:ENGAGEMENT_MANAGER {since: '2021-09-15'}]->(b)
MERGE (cr7:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'ENGAGEMENT_MANAGER'})
ON CREATE SET cr7.id = randomUUID(), cr7.status = 'APPROVED', cr7.duration = 'since 2021-09-15';

MATCH (a:Employee {email: 'neha@collabrix.com'}), (b:Employee {email: 'hiren@collabrix.com'})
MERGE (a)-[:REPORTING_MANAGER {since: '2022-03-07'}]->(b)
MERGE (cr8:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_MANAGER'})
ON CREATE SET cr8.id = randomUUID(), cr8.status = 'APPROVED', cr8.duration = 'since 2022-03-07';

MATCH (a:Employee {email: 'gagan@collabrix.com'}), (b:Employee {email: 'kratika@collabrix.com'})
MERGE (a)-[:REPORTING_MANAGER {since: '2023-08-21'}]->(b)
MERGE (cr9:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'REPORTING_MANAGER'})
ON CREATE SET cr9.id = randomUUID(), cr9.status = 'APPROVED', cr9.duration = 'since 2023-08-21';

MATCH (a:Employee {email: 'raj@collabrix.com'}), (b:Employee {email: 'praveen@collabrix.com'})
MERGE (a)-[:PEER {since: '2022-01-01', project: 'ERP Modernisation'}]->(b)
MERGE (cr10:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'PEER'})
ON CREATE SET cr10.id = randomUUID(), cr10.status = 'APPROVED', cr10.duration = 'since 2022-01-01', cr10.project = 'ERP Modernisation';

MATCH (a:Employee {email: 'neha@collabrix.com'}), (b:Employee {email: 'gagan@collabrix.com'})
MERGE (a)-[:PEER {since: '2023-09-01', project: 'Digital Commerce'}]->(b)
MERGE (cr11:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'PEER'})
ON CREATE SET cr11.id = randomUUID(), cr11.status = 'APPROVED', cr11.duration = 'since 2023-09-01', cr11.project = 'Digital Commerce';

MATCH (a:Employee {email: 'raj@collabrix.com'}), (b:Employee {email: 'neha@collabrix.com'})
MERGE (a)-[:INTERNAL_PRODUCT_DEVELOPMENT {since: '2023-01-15', project: 'Collabrix Platform'}]->(b)
MERGE (cr12:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'INTERNAL_PRODUCT_DEVELOPMENT'})
ON CREATE SET cr12.id = randomUUID(), cr12.status = 'APPROVED', cr12.duration = 'since 2023-01-15', cr12.project = 'Collabrix Platform';

MATCH (a:Employee {email: 'sankara@collabrix.com'}), (b:Employee {email: 'dilip@collabrix.com'})
MERGE (a)-[:ENGAGEMENT_PARTNER {since: '2020-06-01', account: 'RetailX'}]->(b)
MERGE (cr13:ConnectionRequest {fromEmployeeId: id(a), toEmployeeId: id(b), relationshipType: 'ENGAGEMENT_PARTNER'})
ON CREATE SET cr13.id = randomUUID(), cr13.status = 'APPROVED', cr13.duration = 'since 2020-06-01', cr13.account = 'RetailX';

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
