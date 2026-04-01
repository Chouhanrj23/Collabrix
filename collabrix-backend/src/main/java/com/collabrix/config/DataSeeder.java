package com.collabrix.config;

import com.collabrix.entity.ConnectionRequest;
import com.collabrix.entity.Employee;
import com.collabrix.entity.FeedbackRelationship;
import com.collabrix.entity.FeedbackRequest;
import com.collabrix.enums.ConnectionStatus;
import com.collabrix.enums.Designation;
import com.collabrix.enums.RelationshipType;
import com.collabrix.repository.ConnectionRepository;
import com.collabrix.repository.EmployeeRepository;
import com.collabrix.repository.FeedbackRepository;
import com.collabrix.repository.FeedbackRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final EmployeeRepository employeeRepository;
    private final ConnectionRepository connectionRepository;
    private final FeedbackRepository feedbackRepository;
    private final FeedbackRequestRepository feedbackRequestRepository;
    private final PasswordEncoder passwordEncoder;
    private final Driver neo4jDriver;

    private static final String DEPT = "Software Engineering";

    // Standard dates shared by most connections
    private static final String STD_START     = "2021-01-01";
    private static final String STD_CREATED   = "2021-01-01T09:00:00";
    private static final String STD_RESOLVED  = "2021-01-05T09:00:00";

    // Exception — Raj ↔ Praveen PEER connection
    private static final String PEER_START    = "2022-06-01";
    private static final String PEER_CREATED  = "2022-06-01T09:00:00";
    private static final String PEER_RESOLVED = "2022-06-05T09:00:00";

    @Override
    public void run(ApplicationArguments args) {
        if (employeeRepository.count() > 0) {
            log.info("✅ Database already seeded — skipping");
            return;
        }

        String hash = passwordEncoder.encode("Admin@123");

        // ── 1. Employees ──────────────────────────────────────────────────────
        List<Employee> saved = employeeRepository.saveAll(buildEmployees(hash));
        Map<String, Long> id = saved.stream()
                .collect(Collectors.toMap(Employee::getUsername, Employee::getId));

        // ── 2. Project nodes ──────────────────────────────────────────────────
        seedProjects();

        // ── 3. ConnectionRequests ─────────────────────────────────────────────
        List<ConnectionRequest> connections = buildConnections(id);
        connectionRepository.saveAll(connections);

        // ── 4. Feedback ───────────────────────────────────────────────────────
        List<FeedbackRelationship> feedbacks = buildFeedbacks(id);
        feedbacks.removeIf(f -> f == null);
        feedbackRepository.saveAll(feedbacks);

        // ── 5. Pending ConnectionRequests ─────────────────────────────────────
        List<ConnectionRequest> pending = buildPendingConnections(id);
        connectionRepository.saveAll(pending);

        // ── 6. Pending FeedbackRequests ───────────────────────────────────────
        List<FeedbackRequest> feedbackRequests = buildFeedbackRequests(id);
        feedbackRequestRepository.saveAll(feedbackRequests);

        log.info("✅ Collabrix seed data loaded — 21 employees, {} approved + {} pending connections, {} feedback entries, {} feedback requests",
                connections.size(), pending.size(), feedbacks.size(), feedbackRequests.size());
    }

    // ── Employees ─────────────────────────────────────────────────────────────

    private List<Employee> buildEmployees(String hash) {
        return List.of(
                emp("dilip",        "Dilip Srinivas",           "dilip@collabrix.com",          hash, Designation.DIRECTOR,  "GS",     "Internal",            LocalDate.of(2016,  4,  1)),
                emp("sankara",      "T Sankara Subramanian",    "sankara@collabrix.com",         hash, Designation.PARTNER,   "GS",     "Internal",            LocalDate.of(2017,  8, 15)),
                emp("malli",        "Mallikarjun Kandkuru",     "malli@collabrix.com",           hash, Designation.PARTNER,   "Others", "Internal",            LocalDate.of(2018,  1, 10)),
                emp("kratika",      "Kratika Sharma",           "kratika@collabrix.com",         hash, Designation.MANAGER,   "GS",     "Internal",            LocalDate.of(2019,  3, 20)),
                emp("karthik",      "Karthik Pai",              "karthik@collabrix.com",         hash, Designation.MANAGER,   "GS",     "Internal",            LocalDate.of(2019,  7,  1)),
                emp("hiren",        "Hiren Shah",               "hiren@collabrix.com",           hash, Designation.MANAGER,   "Others", "Internal",            LocalDate.of(2020,  2, 14)),
                emp("raj",          "Raj Chouhan",              "raj@collabrix.com",             hash, Designation.CONSULTANT,"GS",     "AI in SDLC, Banking", LocalDate.of(2021,  6,  1)),
                emp("praveen",      "Praveen Agarwal",          "praveen@collabrix.com",         hash, Designation.CONSULTANT,"Others", "AI in SDLC",          LocalDate.of(2021,  9, 15)),
                emp("gagan",        "Gagan Yadav",              "gagan@collabrix.com",           hash, Designation.ASSOCIATE, "Others", "AI in SDLC",          LocalDate.of(2023,  8, 21)),
                emp("ganesh.gatti", "Ganesh Gatti",             "ganesh.gatti@collabrix.com",    hash, Designation.ASSOCIATE, "GS",     "AI in SDLC, Banking", LocalDate.of(2024,  1,  1)),
                emp("nirmal",       "Nirmal Bharadwaj",         "nirmal@collabrix.com",          hash, Designation.MANAGER,   "GS",     "Banking",             LocalDate.of(2019,  5, 10)),
                emp("snehaa",       "Snehaa V",                 "snehaa@collabrix.com",          hash, Designation.MANAGER,   "GS",     "Banking",             LocalDate.of(2020,  3, 15)),
                emp("meraj",        "Meraj Hassan",             "meraj@collabrix.com",           hash, Designation.MANAGER,   "GS",     "Banking",             LocalDate.of(2020,  8,  1)),
                emp("vinayak",      "Vinayak Bandhu",           "vinayak@collabrix.com",         hash, Designation.MANAGER,   "GS",     "Banking",             LocalDate.of(2021,  1, 20)),
                emp("vishal",       "Vishal Kumar",             "vishal@collabrix.com",          hash, Designation.CONSULTANT,"GS",     "Banking",             LocalDate.of(2024,  6,  1)),
                emp("monica",       "Monica B",                 "monica@collabrix.com",          hash, Designation.CONSULTANT,"GS",     "Banking",             LocalDate.of(2024,  7,  1)),
                emp("meet",         "Meet Gandhi",              "meet@collabrix.com",            hash, Designation.CONSULTANT,"GS",     "Banking",             LocalDate.of(2024,  7, 15)),
                emp("kundan",       "Kundan Kumar",             "kundan@collabrix.com",          hash, Designation.CONSULTANT,"GS",     "Banking",             LocalDate.of(2024,  8,  1)),
                emp("ankit",        "Ankit Kumar",              "ankit@collabrix.com",           hash, Designation.ASSOCIATE, "GS",     "Banking",             LocalDate.of(2025,  1,  6)),
                emp("yashraj",      "Yashraj Mandloi",          "yashraj@collabrix.com",         hash, Designation.ASSOCIATE, "GS",     "Banking",             LocalDate.of(2025,  1, 13)),
                emp("prajyot",      "Prajyot Patil",            "prajyot@collabrix.com",         hash, Designation.ASSOCIATE, "GS",     "Banking",             LocalDate.of(2025,  2,  3))
        );
    }

    private Employee emp(String username, String name, String email, String hash,
                         Designation designation, String account, String project,
                         LocalDate joiningDate) {
        return Employee.builder()
                .username(username).name(name).email(email).passwordHash(hash)
                .designation(designation).department(DEPT)
                .account(account).project(project)
                .joiningDate(joiningDate).active(true)
                .build();
    }

    // ── Project nodes ─────────────────────────────────────────────────────────

    private void seedProjects() {
        try (Session session = neo4jDriver.session()) {
            for (String name : List.of("AI in SDLC", "Banking", "Internal")) {
                session.run("MERGE (:Project {name: $name})", Map.of("name", name));
            }
        }
    }

    // ── ConnectionRequests ────────────────────────────────────────────────────

    private List<ConnectionRequest> buildConnections(Map<String, Long> id) {
        long dilip   = id.get("dilip");
        long sankara = id.get("sankara");
        long malli   = id.get("malli");
        long kratika = id.get("kratika");
        long karthik = id.get("karthik");
        long hiren   = id.get("hiren");
        long raj     = id.get("raj");
        long praveen = id.get("praveen");
        long gagan   = id.get("gagan");
        long ganesh  = id.get("ganesh.gatti");
        long nirmal  = id.get("nirmal");
        long snehaa  = id.get("snehaa");
        long meraj   = id.get("meraj");
        long vinayak = id.get("vinayak");
        long vishal  = id.get("vishal");
        long monica  = id.get("monica");
        long meet    = id.get("meet");
        long kundan  = id.get("kundan");
        long ankit   = id.get("ankit");
        long yashraj = id.get("yashraj");
        long prajyot = id.get("prajyot");

        return List.of(
                // Reporting-Partner links (senior ↔ PARTNER/DIRECTOR)
                conn(dilip,   sankara, RelationshipType.REPORTING_PARTNER,  "GS",     "Internal",            STD_START, null, STD_CREATED, STD_RESOLVED),
                conn(dilip,   malli,   RelationshipType.REPORTING_PARTNER,  "Others", "Internal",            STD_START, null, STD_CREATED, STD_RESOLVED),

                // Engagement-Partner
                conn(dilip,   sankara, RelationshipType.ENGAGEMENT_PARTNER, "GS",     "Internal",            STD_START, null, STD_CREATED, STD_RESOLVED),

                // Kratika Sharma senior links
                conn(kratika, sankara, RelationshipType.REPORTING_PARTNER,  "GS",     "Internal",            STD_START, null, STD_CREATED, STD_RESOLVED),
                conn(kratika, dilip,   RelationshipType.REPORTING_MANAGER,  "GS",     "Internal",            STD_START, null, STD_CREATED, STD_RESOLVED),
                conn(kratika, malli,   RelationshipType.ENGAGEMENT_PARTNER, "GS",     "Internal",            STD_START, null, STD_CREATED, STD_RESOLVED),

                // Other manager links
                conn(karthik, malli,   RelationshipType.REPORTING_MANAGER,  "GS",     "Internal",            STD_START, null, STD_CREATED, STD_RESOLVED),
                conn(hiren,   sankara, RelationshipType.ENGAGEMENT_MANAGER, "Others", "Internal",            STD_START, null, STD_CREATED, STD_RESOLVED),

                // Consultant links
                conn(raj,     kratika, RelationshipType.REPORTING_MANAGER,  "GS",     "AI in SDLC, Banking", STD_START, null, STD_CREATED, STD_RESOLVED),
                conn(praveen, karthik, RelationshipType.ENGAGEMENT_MANAGER, "Others", "AI in SDLC",          STD_START, null, STD_CREATED, STD_RESOLVED),

                // Peer
                conn(raj,     praveen, RelationshipType.PEER,               "GS",     "AI in SDLC, Banking", PEER_START, null, PEER_CREATED, PEER_RESOLVED),

                // Associate links
                conn(gagan,   kratika, RelationshipType.REPORTING_MANAGER,  "Others", "AI in SDLC",          STD_START, null, STD_CREATED, STD_RESOLVED),
                conn(ganesh,  kratika, RelationshipType.REPORTING_MANAGER,  "GS",     "AI in SDLC, Banking", STD_START, null, STD_CREATED, STD_RESOLVED),
                conn(ganesh,  hiren,   RelationshipType.ENGAGEMENT_MANAGER, "GS",     "AI in SDLC, Banking", STD_START, null, STD_CREATED, STD_RESOLVED),

                // Nirmal, Snehaa, Meraj, Vinayak — PEER to Kratika, senior links
                conn(nirmal,  kratika, RelationshipType.PEER,               "GS",     "Banking",             "2021-06-01", null, "2021-06-01T09:00:00", "2021-06-05T09:00:00"),
                conn(snehaa,  kratika, RelationshipType.PEER,               "GS",     "Banking",             "2021-06-01", null, "2021-06-01T09:00:00", "2021-06-05T09:00:00"),
                conn(meraj,   kratika, RelationshipType.PEER,               "GS",     "Banking",             "2021-06-01", null, "2021-06-01T09:00:00", "2021-06-05T09:00:00"),
                conn(vinayak, kratika, RelationshipType.PEER,               "GS",     "Banking",             "2021-06-01", null, "2021-06-01T09:00:00", "2021-06-05T09:00:00"),
                conn(nirmal,  sankara, RelationshipType.REPORTING_MANAGER,  "GS",     "Banking",             STD_START, null, STD_CREATED, STD_RESOLVED),
                conn(snehaa,  sankara, RelationshipType.REPORTING_MANAGER,  "GS",     "Banking",             STD_START, null, STD_CREATED, STD_RESOLVED),
                conn(meraj,   sankara, RelationshipType.REPORTING_MANAGER,  "GS",     "Banking",             STD_START, null, STD_CREATED, STD_RESOLVED),
                conn(vinayak, sankara, RelationshipType.REPORTING_MANAGER,  "GS",     "Banking",             STD_START, null, STD_CREATED, STD_RESOLVED),

                // Vishal Kumar links
                conn(vishal,  kratika, RelationshipType.REPORTING_MANAGER,  "GS",     "Banking",             "2024-06-15", null, "2024-06-15T09:00:00", "2024-06-20T09:00:00"),

                // Monica B, Meet Gandhi, Kundan Kumar — Consultant → Kratika
                conn(monica,  kratika, RelationshipType.REPORTING_MANAGER,  "GS",     "Banking",             "2024-07-10", null, "2024-07-10T09:00:00", "2024-07-15T09:00:00"),
                conn(meet,    kratika, RelationshipType.REPORTING_MANAGER,  "GS",     "Banking",             "2024-07-25", null, "2024-07-25T09:00:00", "2024-07-30T09:00:00"),
                conn(kundan,  kratika, RelationshipType.REPORTING_MANAGER,  "GS",     "Banking",             "2024-08-10", null, "2024-08-10T09:00:00", "2024-08-15T09:00:00"),

                // Ankit Kumar, Yashraj Mandloi, Prajyot Patil — Associate → Kratika
                conn(ankit,   kratika, RelationshipType.REPORTING_MANAGER,  "GS",     "Banking",             "2025-01-10", null, "2025-01-10T09:00:00", "2025-01-15T09:00:00"),
                conn(yashraj, kratika, RelationshipType.REPORTING_MANAGER,  "GS",     "Banking",             "2025-01-17", null, "2025-01-17T09:00:00", "2025-01-22T09:00:00"),
                conn(prajyot, kratika, RelationshipType.REPORTING_MANAGER,  "GS",     "Banking",             "2025-02-07", null, "2025-02-07T09:00:00", "2025-02-12T09:00:00")
        );
    }

    private ConnectionRequest conn(long fromId, long toId, RelationshipType type,
                                   String account, String project,
                                   String startDate, String endDate,
                                   String createdAt, String resolvedAt) {
        return ConnectionRequest.builder()
                .fromEmployeeId(fromId).toEmployeeId(toId)
                .relationshipType(type)
                .status(ConnectionStatus.APPROVED)
                .department(DEPT).account(account).project(project)
                .startDate(startDate).endDate(endDate)
                .createdAt(createdAt).resolvedAt(resolvedAt)
                .build();
    }

    // ── Feedback (50 entries — 5 per employee) ────────────────────────────────

    private List<FeedbackRelationship> buildFeedbacks(Map<String, Long> id) {
        List<FeedbackRelationship> list = new ArrayList<>();

        // ── Nirmal Bharadwaj ──────────────────────────────────────────────────
        list.add(fb(id, "dilip",    "nirmal",  5, "Strong manager with excellent Banking domain expertise.",        "2022-03-10", false));
        list.add(fb(id, "sankara",  "nirmal",  4, "Reliable delivery and good stakeholder management.",             "2022-07-15", false));
        list.add(fb(id, "kratika",  "nirmal",  4, "Great peer collaboration on Banking initiatives.",               "2023-01-20", false));
        list.add(fb(id, "malli",    "nirmal",  5, "Exceptional leadership on the GS Banking account.",              "2023-06-05", false));
        list.add(fb(id, "dilip",    "nirmal",  5, "Consistently exceeds expectations on delivery.",                 "2024-02-18", true));

        // ── Snehaa V ──────────────────────────────────────────────────────────
        list.add(fb(id, "dilip",    "snehaa",  4, "Strong analytical skills, excellent Banking project delivery.",  "2022-04-12", false));
        list.add(fb(id, "sankara",  "snehaa",  5, "Outstanding client engagement and communication.",               "2022-09-20", false));
        list.add(fb(id, "kratika",  "snehaa",  4, "Collaborative peer, always willing to share knowledge.",         "2023-02-14", false));
        list.add(fb(id, "malli",    "snehaa",  4, "Solid performance across Banking deliverables.",                 "2023-08-10", false));
        list.add(fb(id, "dilip",    "snehaa",  5, "Impressive growth and leadership this year.",                    "2024-03-22", true));

        // ── Meraj Hassan ──────────────────────────────────────────────────────
        list.add(fb(id, "dilip",    "meraj",   4, "Good technical depth and consistent Banking delivery.",          "2022-05-18", false));
        list.add(fb(id, "sankara",  "meraj",   4, "Reliable manager with strong team coordination skills.",         "2022-11-08", false));
        list.add(fb(id, "kratika",  "meraj",   5, "Excellent peer support and cross-team collaboration.",           "2023-03-25", false));
        list.add(fb(id, "malli",    "meraj",   4, "Strong contributor to Banking account growth.",                  "2023-09-14", false));
        list.add(fb(id, "dilip",    "meraj",   4, "Dependable and consistent performer on GS account.",             "2024-04-10", true));

        // ── Vinayak Bandhu ────────────────────────────────────────────────────
        list.add(fb(id, "dilip",    "vinayak", 4, "Good leadership on Banking project, strong delivery focus.",     "2022-06-22", false));
        list.add(fb(id, "sankara",  "vinayak", 5, "Exceptional stakeholder management and communication skills.",   "2022-12-15", false));
        list.add(fb(id, "kratika",  "vinayak", 4, "Great peer, always collaborative and supportive.",               "2023-04-18", false));
        list.add(fb(id, "malli",    "vinayak", 4, "Consistent performance, strong ownership of GS account tasks.",  "2023-10-02", false));
        list.add(fb(id, "dilip",    "vinayak", 5, "Outstanding contribution to Banking account in Q1.",             "2024-05-08", true));

        // ── Monica B ──────────────────────────────────────────────────────────
        list.add(fb(id, "kratika",  "monica",  4, "Strong delivery on Banking tasks, good communication skills.",  "2024-08-20", false));
        list.add(fb(id, "dilip",    "monica",  4, "Quickly grasped project context and delivered consistently.",   "2024-09-10", false));
        list.add(fb(id, "raj",      "monica",  4, "Collaborative team member, great attention to detail.",         "2024-10-05", false));
        list.add(fb(id, "sankara",  "monica",  5, "Exceptional contribution to the Banking module in Q3.",         "2024-11-15", true));
        list.add(fb(id, "kratika",  "monica",  4, "Consistent performance, reliable on deliverables.",             "2025-01-20", false));

        // ── Meet Gandhi ───────────────────────────────────────────────────────
        list.add(fb(id, "kratika",  "meet",    4, "Good analytical thinking and proactive problem solving.",       "2024-09-01", false));
        list.add(fb(id, "dilip",    "meet",    3, "Needs to improve documentation and status communication.",      "2024-10-12", false));
        list.add(fb(id, "raj",      "meet",    4, "Solid technical skills, integrates well with the team.",        "2024-11-08", false));
        list.add(fb(id, "sankara",  "meet",    4, "Good progress on Banking deliverables.",                        "2025-01-14", false));
        list.add(fb(id, "kratika",  "meet",    5, "Outstanding performance in year-end sprint.",                   "2025-02-10", true));

        // ── Kundan Kumar ──────────────────────────────────────────────────────
        list.add(fb(id, "kratika",  "kundan",  3, "Getting up to speed, needs more initiative on complex tasks.",  "2024-09-20", false));
        list.add(fb(id, "dilip",    "kundan",  4, "Shows potential, good attitude towards feedback.",              "2024-10-30", false));
        list.add(fb(id, "raj",      "kundan",  4, "Dependable on assigned tasks, good team player.",               "2024-12-05", false));
        list.add(fb(id, "sankara",  "kundan",  4, "Improved significantly over the last quarter.",                 "2025-01-25", false));
        list.add(fb(id, "kratika",  "kundan",  5, "Excellent Banking module delivery in Q4.",                      "2025-02-20", true));

        // ── Ankit Kumar ───────────────────────────────────────────────────────
        list.add(fb(id, "kratika",  "ankit",   4, "Strong start, picks up tasks quickly for a fresher.",          "2025-02-01", false));
        list.add(fb(id, "vishal",   "ankit",   3, "Needs more confidence in technical discussions.",               "2025-02-15", false));
        list.add(fb(id, "raj",      "ankit",   4, "Good learner, eager to contribute to the Banking project.",     "2025-02-28", false));
        list.add(fb(id, "monica",   "ankit",   4, "Collaborative and responsive to guidance.",                     "2025-03-10", false));
        list.add(fb(id, "kratika",  "ankit",   4, "Solid Q1 performance for a new associate.",                     "2025-03-20", true));

        // ── Yashraj Mandloi ───────────────────────────────────────────────────
        list.add(fb(id, "kratika",  "yashraj", 4, "Great attitude and willingness to learn.",                      "2025-02-05", false));
        list.add(fb(id, "vishal",   "yashraj", 4, "Good technical fundamentals, quick to deliver small tasks.",    "2025-02-18", false));
        list.add(fb(id, "meet",     "yashraj", 3, "Should communicate progress more proactively.",                 "2025-03-01", false));
        list.add(fb(id, "monica",   "yashraj", 4, "Team player, supports colleagues well.",                        "2025-03-12", false));
        list.add(fb(id, "kratika",  "yashraj", 5, "Impressive ramp-up, exceeded expectations in first quarter.",   "2025-03-25", true));

        // ── Prajyot Patil ─────────────────────────────────────────────────────
        list.add(fb(id, "kratika",  "prajyot", 3, "Early days — needs to be more proactive on task ownership.",    "2025-03-01", false));
        list.add(fb(id, "vishal",   "prajyot", 4, "Good foundational skills, integrates well with the team.",      "2025-03-10", false));
        list.add(fb(id, "meet",     "prajyot", 4, "Positive attitude and quick to adapt to project processes.",    "2025-03-18", false));
        list.add(fb(id, "kundan",   "prajyot", 4, "Collaborative and eager to learn from seniors.",                "2025-03-22", false));
        list.add(fb(id, "kratika",  "prajyot", 4, "Promising start, keep up the momentum.",                        "2025-03-28", true));

        // ── Vishal Kumar ──────────────────────────────────────────────────────
        list.add(fb(id, "kratika",  "vishal", 4, "Good start on the Banking project, shows strong fundamentals.",  "2024-07-15", false));
        list.add(fb(id, "dilip",    "vishal", 4, "Promising consultant, adapts quickly to project needs.",         "2024-08-10", false));
        list.add(fb(id, "raj",      "vishal", 3, "Needs to take more ownership and communicate blockers early.",   "2024-09-05", false));
        list.add(fb(id, "kratika",  "vishal", 5, "Excellent delivery on Banking module in Q3.",                    "2024-10-20", true));
        list.add(fb(id, "sankara",  "vishal", 4, "Good team player, contributes well to GS account goals.",        "2025-01-08", false));

        // ── Ganesh Gatti ──────────────────────────────────────────────────────
        list.add(fb(id, "kratika",  "ganesh.gatti", 4, "Good progress on AI in SDLC tasks. Keep it up.",        "2024-02-10", false));
        list.add(fb(id, "hiren",    "ganesh.gatti", 3, "Needs to improve communication with the team.",          "2024-03-15", false));
        list.add(fb(id, "raj",      "ganesh.gatti", 4, "Collaborative and quick learner.",                       "2024-04-20", false));
        list.add(fb(id, "kratika",  "ganesh.gatti", 5, "Excellent delivery on Banking module.",                  "2024-06-01", true));
        list.add(fb(id, "dilip",    "ganesh.gatti", 4, "Promising consultant, good technical skills.",           "2024-07-10", false));

        // ── Gagan Yadav ───────────────────────────────────────────────────────
        list.add(fb(id, "kratika",  "gagan", 4, "Strong analytical skills on AI in SDLC.",                      "2023-03-10", false));
        list.add(fb(id, "hiren",    "gagan", 3, "Needs more initiative in problem solving.",                     "2023-05-20", false));
        list.add(fb(id, "dilip",    "gagan", 5, "Exceptional work on sprint delivery.",                          "2023-08-15", false));
        list.add(fb(id, "praveen",  "gagan", 4, "Good team player and quick to adapt.",                          "2023-10-01", false));
        list.add(fb(id, "sankara",  "gagan", 4, "Shows great potential for growth.",                             "2024-01-05", true));

        // ── Praveen Agarwal ───────────────────────────────────────────────────
        list.add(fb(id, "kratika",  "praveen", 4, "Solid backend development skills.",                           "2023-02-14", false));
        list.add(fb(id, "hiren",    "praveen", 4, "Reliable and delivers on time.",                              "2023-04-22", false));
        list.add(fb(id, "dilip",    "praveen", 3, "Should take more ownership of tasks.",                        "2023-07-10", false));
        list.add(fb(id, "sankara",  "praveen", 5, "Outstanding contribution to internal tools.",                 "2023-09-30", false));
        list.add(fb(id, "malli",    "praveen", 4, "Good problem solving approach.",                              "2024-02-20", true));

        // ── Raj Chouhan ───────────────────────────────────────────────────────
        list.add(fb(id, "kratika",  "raj", 5, "Excellent delivery on Banking project.",                          "2023-03-05", false));
        list.add(fb(id, "hiren",    "raj", 4, "Strong technical and communication skills.",                      "2023-06-18", false));
        list.add(fb(id, "dilip",    "raj", 4, "Consistently meets project milestones.",                          "2023-09-12", false));
        list.add(fb(id, "malli",    "raj", 5, "One of the best consultants on the team.",                        "2023-11-25", false));
        list.add(fb(id, "sankara",  "raj", 4, "Great ownership and leadership qualities.",                       "2024-03-10", true));

        // ── Hiren Shah ────────────────────────────────────────────────────────
        list.add(fb(id, "dilip",    "hiren", 4, "Strong manager with great delivery record.",                    "2023-01-20", false));
        list.add(fb(id, "sankara",  "hiren", 5, "Excellent stakeholder management skills.",                      "2023-04-15", false));
        list.add(fb(id, "malli",    "hiren", 4, "Consistently drives team performance.",                         "2023-07-08", false));
        list.add(fb(id, "kratika",  "hiren", 4, "Good peer collaboration across projects.",                      "2023-10-14", false));
        list.add(fb(id, "dilip",    "hiren", 5, "Exceptional leadership in Q4 delivery.",                        "2024-01-30", true));

        // ── Kratika Sharma ────────────────────────────────────────────────────
        list.add(fb(id, "dilip",    "kratika", 5, "Excellent manager with strong delivery focus.",                "2023-02-10", false));
        list.add(fb(id, "sankara",  "kratika", 4, "Good leadership and team management.",                        "2023-05-22", false));
        list.add(fb(id, "malli",    "kratika", 5, "Outstanding performance on GS account.",                      "2023-08-30", false));
        list.add(fb(id, "hiren",    "kratika", 4, "Strong peer support and collaboration.",                      "2023-11-10", false));
        list.add(fb(id, "dilip",    "kratika", 5, "Impressive growth as a manager this year.",                   "2024-04-05", true));

        // ── Karthik Pai ───────────────────────────────────────────────────────
        list.add(fb(id, "dilip",    "karthik", 4, "Dependable manager with solid delivery.",                     "2023-03-18", false));
        list.add(fb(id, "sankara",  "karthik", 4, "Good cross-team coordination skills.",                        "2023-06-25", false));
        list.add(fb(id, "malli",    "karthik", 3, "Needs to improve strategic thinking.",                        "2023-09-05", false));
        list.add(fb(id, "hiren",    "karthik", 4, "Great peer and reliable team member.",                        "2023-12-01", false));
        list.add(fb(id, "kratika",  "karthik", 5, "Excellent collaboration on GS account.",                      "2024-05-15", true));

        // ── Dilip Srinivas ────────────────────────────────────────────────────
        list.add(fb(id, "sankara",  "dilip", 5, "Visionary director with strong execution.",                     "2023-01-15", false));
        list.add(fb(id, "malli",    "dilip", 4, "Great leadership across multiple accounts.",                    "2023-04-20", false));
        list.add(fb(id, "sankara",  "dilip", 5, "Outstanding delivery on GS account.",                           "2023-08-10", false));
        list.add(fb(id, "malli",    "dilip", 4, "Strong business development contribution.",                     "2023-11-20", false));
        list.add(fb(id, "sankara",  "dilip", 5, "Exceptional strategic leadership this year.",                   "2024-06-01", true));

        // ── Mallikarjun Kandkuru ──────────────────────────────────────────────
        list.add(fb(id, "sankara",  "malli", 5, "Outstanding partner level contributions.",                      "2023-02-05", false));
        list.add(fb(id, "dilip",    "malli", 4, "Strong client relationships and delivery.",                     "2023-05-15", false));
        list.add(fb(id, "sankara",  "malli", 5, "Excellent leadership on internal projects.",                    "2023-09-20", false));
        list.add(fb(id, "dilip",    "malli", 4, "Great mentorship of junior team members.",                      "2023-12-10", false));
        list.add(fb(id, "sankara",  "malli", 5, "Consistent top performer at partner level.",                    "2024-04-25", true));

        // ── T Sankara Subramanian ─────────────────────────────────────────────
        list.add(fb(id, "malli",    "sankara", 5, "Exceptional partner and firm leader.",                        "2023-01-10", false));
        list.add(fb(id, "dilip",    "sankara", 5, "Outstanding strategic vision and execution.",                  "2023-04-18", false));
        list.add(fb(id, "malli",    "sankara", 4, "Strong client engagement and delivery.",                      "2023-08-22", false));
        list.add(fb(id, "dilip",    "sankara", 5, "Excellent mentorship and leadership.",                        "2023-11-15", false));
        list.add(fb(id, "malli",    "sankara", 5, "Best partner in the Software Engineering unit.",              "2024-05-10", true));

        return list;
    }

    private FeedbackRelationship fb(Map<String, Long> id,
                                    String fromUsername, String toUsername,
                                    int rating, String comment,
                                    String dateStr, boolean isResponse) {
        Long fromId = id.get(fromUsername);
        Long toId   = id.get(toUsername);
        if (fromId == null || toId == null) {
            log.warn("DataSeeder: could not resolve IDs for {} → {}", fromUsername, toUsername);
            return null;
        }
        return FeedbackRelationship.builder()
                .fromEmployeeId(fromId).toEmployeeId(toId)
                .rating(rating).comment(comment)
                .feedbackDate(LocalDate.parse(dateStr))
                .isResponse(isResponse)
                .build();
    }

    // ── Pending ConnectionRequests ────────────────────────────────────────────

    private List<ConnectionRequest> buildPendingConnections(Map<String, Long> id) {
        long dilip   = id.get("dilip");
        long sankara = id.get("sankara");
        long malli   = id.get("malli");
        long kratika = id.get("kratika");
        long karthik = id.get("karthik");
        long monica  = id.get("monica");
        long meet    = id.get("meet");
        long kundan  = id.get("kundan");
        long ankit   = id.get("ankit");
        long yashraj = id.get("yashraj");
        long prajyot = id.get("prajyot");
        long vishal  = id.get("vishal");

        return List.of(
                pendingConn(monica,  dilip,   RelationshipType.REPORTING_PARTNER,  "GS",     "Banking",             "2026-01-10", null, "2026-01-10T10:00:00"),
                pendingConn(meet,    sankara, RelationshipType.REPORTING_PARTNER,  "GS",     "Banking",             "2026-01-20", null, "2026-01-20T11:00:00"),
                pendingConn(kundan,  malli,   RelationshipType.ENGAGEMENT_PARTNER, "GS",     "Banking",             "2026-02-03", null, "2026-02-03T09:30:00"),
                pendingConn(vishal,  kratika, RelationshipType.ENGAGEMENT_MANAGER, "GS",     "Banking",             "2026-02-14", null, "2026-02-14T14:00:00"),
                pendingConn(ankit,   karthik, RelationshipType.ENGAGEMENT_MANAGER, "GS",     "Banking",             "2026-03-01", null, "2026-03-01T09:00:00"),
                pendingConn(yashraj, kratika, RelationshipType.PEER,               "GS",     "Banking",             "2026-03-10", null, "2026-03-10T10:00:00"),
                pendingConn(prajyot, kratika, RelationshipType.ENGAGEMENT_MANAGER, "GS",     "Banking",             "2026-03-20", null, "2026-03-20T11:00:00")
        );
    }

    private ConnectionRequest pendingConn(long fromId, long toId, RelationshipType type,
                                          String account, String project,
                                          String startDate, String endDate,
                                          String createdAt) {
        return ConnectionRequest.builder()
                .fromEmployeeId(fromId).toEmployeeId(toId)
                .relationshipType(type)
                .status(ConnectionStatus.PENDING)
                .department(DEPT).account(account).project(project)
                .startDate(startDate).endDate(endDate)
                .createdAt(createdAt)
                .build();
    }

    // ── Pending FeedbackRequests ──────────────────────────────────────────────

    private List<FeedbackRequest> buildFeedbackRequests(Map<String, Long> id) {
        long dilip   = id.get("dilip");
        long sankara = id.get("sankara");
        long kratika = id.get("kratika");
        long karthik = id.get("karthik");
        long raj     = id.get("raj");
        long vishal  = id.get("vishal");
        long monica  = id.get("monica");
        long meet    = id.get("meet");
        long kundan  = id.get("kundan");
        long ankit   = id.get("ankit");
        long yashraj = id.get("yashraj");
        long prajyot = id.get("prajyot");

        return List.of(
                feedbackReq(vishal,  dilip,   "Please share feedback on my performance in the Banking project.",        LocalDateTime.of(2026, 1, 12, 9, 0)),
                feedbackReq(monica,  dilip,   "Would appreciate your feedback on my recent Banking deliverables.",      LocalDateTime.of(2026, 1, 22, 10, 30)),
                feedbackReq(meet,    sankara, "Requesting feedback on my work in the Banking module this quarter.",     LocalDateTime.of(2026, 2, 5, 11, 0)),
                feedbackReq(kundan,  kratika, "Please evaluate my performance and areas of improvement.",               LocalDateTime.of(2026, 2, 18, 14, 0)),
                feedbackReq(ankit,   karthik, "Feedback requested for my Q1 performance review.",                      LocalDateTime.of(2026, 3, 5, 9, 0)),
                feedbackReq(yashraj, raj,     "Please share feedback on my contributions to the Banking project.",     LocalDateTime.of(2026, 3, 12, 10, 0)),
                feedbackReq(prajyot, kratika, "Requesting feedback on my onboarding and initial deliverables.",        LocalDateTime.of(2026, 3, 22, 9, 30))
        );
    }

    private FeedbackRequest feedbackReq(long requestedById, long requestedFromId,
                                        String message, LocalDateTime requestedAt) {
        return FeedbackRequest.builder()
                .requestedByEmployeeId(requestedById)
                .requestedFromEmployeeId(requestedFromId)
                .message(message)
                .fulfilled(false)
                .requestedAt(requestedAt)
                .build();
    }
}
