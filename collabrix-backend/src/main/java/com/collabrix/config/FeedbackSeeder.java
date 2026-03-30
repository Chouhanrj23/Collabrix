package com.collabrix.config;

import com.collabrix.entity.Employee;
import com.collabrix.entity.FeedbackRelationship;
import com.collabrix.repository.EmployeeRepository;
import com.collabrix.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Seeds exactly 5 feedback entries per employee (50 total).
 * Wipes and reseeds on every startup for a clean consistent state.
 * Runs at Order 2, after DataSeeder.
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class FeedbackSeeder implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final FeedbackRepository feedbackRepository;

    @Override
    public void run(String... args) {
        long existing = feedbackRepository.count();
        if (existing > 0) {
            log.info("FeedbackSeeder: feedback already seeded ({} entries) — skipping", existing);
            return;
        }

        List<Employee> employees = employeeRepository.findAll();
        if (employees.isEmpty()) {
            log.warn("FeedbackSeeder: no employees found — skipping");
            return;
        }

        Map<String, Long> idByEmail = employees.stream()
                .collect(Collectors.toMap(Employee::getEmail, Employee::getId));

        List<FeedbackRelationship> feedbacks = buildFeedbacks(idByEmail);
        feedbacks.removeIf(f -> f == null);

        feedbackRepository.saveAll(feedbacks);
        log.info("FeedbackSeeder: inserted {} feedback entries", feedbacks.size());
    }

    private List<FeedbackRelationship> buildFeedbacks(Map<String, Long> id) {
        List<FeedbackRelationship> list = new ArrayList<>();

        // ── Ganesh Gatti (5 entries) ─────────────────────────────────────────
        list.add(fb(id, "kratika", "ganesh", 4,
                "Good progress on AI in SDLC tasks. Keep it up.", "2024-02-10", false));
        list.add(fb(id, "hiren", "ganesh", 3,
                "Needs to improve communication with the team.", "2024-03-15", false));
        list.add(fb(id, "raj", "ganesh", 4,
                "Collaborative and quick learner.", "2024-04-20", false));
        list.add(fb(id, "kratika", "ganesh", 5,
                "Excellent delivery on Banking module.", "2024-06-01", true));
        list.add(fb(id, "dilip", "ganesh", 4,
                "Promising consultant, good technical skills.", "2024-07-10", false));

        // ── Gagan Yadav (5 entries) ──────────────────────────────────────────
        list.add(fb(id, "kratika", "gagan", 4,
                "Strong analytical skills on AI in SDLC.", "2023-03-10", false));
        list.add(fb(id, "hiren", "gagan", 3,
                "Needs more initiative in problem solving.", "2023-05-20", false));
        list.add(fb(id, "dilip", "gagan", 5,
                "Exceptional work on sprint delivery.", "2023-08-15", false));
        list.add(fb(id, "praveen", "gagan", 4,
                "Good team player and quick to adapt.", "2023-10-01", false));
        list.add(fb(id, "sankara", "gagan", 4,
                "Shows great potential for growth.", "2024-01-05", true));

        // ── Praveen Agarwal (5 entries) ──────────────────────────────────────
        list.add(fb(id, "kratika", "praveen", 4,
                "Solid backend development skills.", "2023-02-14", false));
        list.add(fb(id, "hiren", "praveen", 4,
                "Reliable and delivers on time.", "2023-04-22", false));
        list.add(fb(id, "dilip", "praveen", 3,
                "Should take more ownership of tasks.", "2023-07-10", false));
        list.add(fb(id, "sankara", "praveen", 5,
                "Outstanding contribution to internal tools.", "2023-09-30", false));
        list.add(fb(id, "malli", "praveen", 4,
                "Good problem solving approach.", "2024-02-20", true));

        // ── Raj Chouhan (5 entries) ──────────────────────────────────────────
        list.add(fb(id, "kratika", "raj", 5,
                "Excellent delivery on Banking project.", "2023-03-05", false));
        list.add(fb(id, "hiren", "raj", 4,
                "Strong technical and communication skills.", "2023-06-18", false));
        list.add(fb(id, "dilip", "raj", 4,
                "Consistently meets project milestones.", "2023-09-12", false));
        list.add(fb(id, "malli", "raj", 5,
                "One of the best consultants on the team.", "2023-11-25", false));
        list.add(fb(id, "sankara", "raj", 4,
                "Great ownership and leadership qualities.", "2024-03-10", true));

        // ── Hiren Shah (5 entries) ───────────────────────────────────────────
        list.add(fb(id, "dilip", "hiren", 4,
                "Strong manager with great delivery record.", "2023-01-20", false));
        list.add(fb(id, "sankara", "hiren", 5,
                "Excellent stakeholder management skills.", "2023-04-15", false));
        list.add(fb(id, "malli", "hiren", 4,
                "Consistently drives team performance.", "2023-07-08", false));
        list.add(fb(id, "kratika", "hiren", 4,
                "Good peer collaboration across projects.", "2023-10-14", false));
        list.add(fb(id, "dilip", "hiren", 5,
                "Exceptional leadership in Q4 delivery.", "2024-01-30", true));

        // ── Kratika Sharma (5 entries) ───────────────────────────────────────
        list.add(fb(id, "dilip", "kratika", 5,
                "Excellent manager with strong delivery focus.", "2023-02-10", false));
        list.add(fb(id, "sankara", "kratika", 4,
                "Good leadership and team management.", "2023-05-22", false));
        list.add(fb(id, "malli", "kratika", 5,
                "Outstanding performance on GS account.", "2023-08-30", false));
        list.add(fb(id, "hiren", "kratika", 4,
                "Strong peer support and collaboration.", "2023-11-10", false));
        list.add(fb(id, "dilip", "kratika", 5,
                "Impressive growth as a manager this year.", "2024-04-05", true));

        // ── Karthik Pai (5 entries) ──────────────────────────────────────────
        list.add(fb(id, "dilip", "karthik", 4,
                "Dependable manager with solid delivery.", "2023-03-18", false));
        list.add(fb(id, "sankara", "karthik", 4,
                "Good cross-team coordination skills.", "2023-06-25", false));
        list.add(fb(id, "malli", "karthik", 3,
                "Needs to improve strategic thinking.", "2023-09-05", false));
        list.add(fb(id, "hiren", "karthik", 4,
                "Great peer and reliable team member.", "2023-12-01", false));
        list.add(fb(id, "kratika", "karthik", 5,
                "Excellent collaboration on GS account.", "2024-05-15", true));

        // ── Dilip Srinivas (5 entries) ───────────────────────────────────────
        list.add(fb(id, "sankara", "dilip", 5,
                "Visionary director with strong execution.", "2023-01-15", false));
        list.add(fb(id, "malli", "dilip", 4,
                "Great leadership across multiple accounts.", "2023-04-20", false));
        list.add(fb(id, "sankara", "dilip", 5,
                "Outstanding delivery on GS account.", "2023-08-10", false));
        list.add(fb(id, "malli", "dilip", 4,
                "Strong business development contribution.", "2023-11-20", false));
        list.add(fb(id, "sankara", "dilip", 5,
                "Exceptional strategic leadership this year.", "2024-06-01", true));

        // ── Mallikarjun Kandkuru (5 entries) ─────────────────────────────────
        list.add(fb(id, "sankara", "malli", 5,
                "Outstanding partner level contributions.", "2023-02-05", false));
        list.add(fb(id, "dilip", "malli", 4,
                "Strong client relationships and delivery.", "2023-05-15", false));
        list.add(fb(id, "sankara", "malli", 5,
                "Excellent leadership on internal projects.", "2023-09-20", false));
        list.add(fb(id, "dilip", "malli", 4,
                "Great mentorship of junior team members.", "2023-12-10", false));
        list.add(fb(id, "sankara", "malli", 5,
                "Consistent top performer at partner level.", "2024-04-25", true));

        // ── T Sankara Subramanian (5 entries) ────────────────────────────────
        list.add(fb(id, "malli", "sankara", 5,
                "Exceptional partner and firm leader.", "2023-01-10", false));
        list.add(fb(id, "dilip", "sankara", 5,
                "Outstanding strategic vision and execution.", "2023-04-18", false));
        list.add(fb(id, "malli", "sankara", 4,
                "Strong client engagement and delivery.", "2023-08-22", false));
        list.add(fb(id, "dilip", "sankara", 5,
                "Excellent mentorship and leadership.", "2023-11-15", false));
        list.add(fb(id, "malli", "sankara", 5,
                "Best partner in the Software Engineering unit.", "2024-05-10", true));

        return list;
    }

    private FeedbackRelationship fb(
            Map<String, Long> idMap,
            String fromUsername, String toUsername,
            int rating, String comment, String dateStr, boolean isResponse) {

        Long fromId = idMap.get(fromUsername + "@collabrix.com");
        Long toId = idMap.get(toUsername + "@collabrix.com");

        if (fromId == null || toId == null) {
            log.warn("FeedbackSeeder: could not resolve IDs for {} → {}", fromUsername, toUsername);
            return null;
        }

        return FeedbackRelationship.builder()
                .fromEmployeeId(fromId)
                .toEmployeeId(toId)
                .rating(rating)
                .comment(comment)
                .feedbackDate(LocalDate.parse(dateStr))
                .isResponse(isResponse)
                .build();
    }
}
