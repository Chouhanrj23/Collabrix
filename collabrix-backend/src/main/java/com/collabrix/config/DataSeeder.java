package com.collabrix.config;

import com.collabrix.entity.ConnectionRequest;
import com.collabrix.entity.Employee;
import com.collabrix.entity.FeedbackRelationship;
import com.collabrix.enums.ConnectionStatus;
import com.collabrix.enums.Designation;
import com.collabrix.enums.RelationshipType;
import com.collabrix.repository.ConnectionRepository;
import com.collabrix.repository.EmployeeRepository;
import com.collabrix.repository.FeedbackRepository;
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

        log.info("✅ Collabrix seed data loaded — 10 employees, {} connections, {} feedback entries",
                connections.size(), feedbacks.size());
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
                emp("ganesh.gatti", "Ganesh Gatti",             "ganesh.gatti@collabrix.com",    hash, Designation.ASSOCIATE, "GS",     "AI in SDLC, Banking", LocalDate.of(2024,  1,  1))
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

        return List.of(
                // Reporting-Partner links (senior ↔ PARTNER/DIRECTOR)
                conn(sankara, dilip,   RelationshipType.REPORTING_PARTNER,  "GS",     "Internal",            STD_START, null, STD_CREATED, STD_RESOLVED),
                conn(malli,   dilip,   RelationshipType.REPORTING_PARTNER,  "Others", "Internal",            STD_START, null, STD_CREATED, STD_RESOLVED),

                // Engagement-Partner
                conn(sankara, dilip,   RelationshipType.ENGAGEMENT_PARTNER, "GS",     "Internal",            STD_START, null, STD_CREATED, STD_RESOLVED),

                // Manager links
                conn(kratika, sankara, RelationshipType.REPORTING_MANAGER,  "GS",     "Internal",            STD_START, null, STD_CREATED, STD_RESOLVED),
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
                conn(ganesh,  hiren,   RelationshipType.ENGAGEMENT_MANAGER, "GS",     "AI in SDLC, Banking", STD_START, null, STD_CREATED, STD_RESOLVED)
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
}
