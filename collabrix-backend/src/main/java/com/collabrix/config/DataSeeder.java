package com.collabrix.config;

import com.collabrix.entity.Employee;
import com.collabrix.enums.Designation;
import com.collabrix.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

// Run seed-data.cypher manually in Neo4j Browser to create relationships after first startup

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (employeeRepository.count() > 0) {
            log.info("Seed data present — skipping");
            return;
        }

        String hash = passwordEncoder.encode("Admin@123");
        String dept = "Software Engineering";

        List<Employee> employees = List.of(
                buildEmployee("dilip", "Dilip Srinivas", "dilip@collabrix.com",
                        hash, Designation.DIRECTOR, dept, LocalDate.of(2016, 4, 1),
                        "INTERNAL", "Leadership"),

                buildEmployee("sankara", "T Sankara Subramanian", "sankara@collabrix.com",
                        hash, Designation.PARTNER, dept, LocalDate.of(2017, 8, 15),
                        "Pinnacle Banking", "Digital Transformation"),

                buildEmployee("malli", "Mallikarjun Kandkuru", "malli@collabrix.com",
                        hash, Designation.PARTNER, dept, LocalDate.of(2018, 1, 10),
                        "TechVision Corp", "Cloud Migration"),

                buildEmployee("kratika", "Kratika Sharma", "kratika@collabrix.com",
                        hash, Designation.MANAGER, dept, LocalDate.of(2019, 3, 20),
                        "Pinnacle Banking", "AI in SDLC"),

                buildEmployee("karthik", "Karthik Pai", "karthik@collabrix.com",
                        hash, Designation.MANAGER, dept, LocalDate.of(2019, 7, 1),
                        "TechVision Corp", "Cloud Migration"),

                buildEmployee("hiren", "Hiren Shah", "hiren@collabrix.com",
                        hash, Designation.MANAGER, dept, LocalDate.of(2020, 2, 14),
                        "Pinnacle Banking", "AI in SDLC"),

                buildEmployee("raj", "Raj Chouhan", "raj@collabrix.com",
                        hash, Designation.CONSULTANT, dept, LocalDate.of(2021, 6, 1),
                        "Pinnacle Banking", "AI in SDLC, Banking"),

                buildEmployee("praveen", "Praveen Agarwal", "praveen@collabrix.com",
                        hash, Designation.CONSULTANT, dept, LocalDate.of(2021, 9, 15),
                        "TechVision Corp", "Cloud Migration"),

                buildEmployee("gagan", "Gagan Yadav", "gagan@collabrix.com",
                        hash, Designation.ASSOCIATE, dept, LocalDate.of(2023, 8, 21),
                        "Pinnacle Banking", "AI in SDLC"),

                buildEmployee("ganesh", "Ganesh Gatti", "ganesh@collabrix.com",
                        hash, Designation.ASSOCIATE, dept, LocalDate.of(2024, 1, 15),
                        "Pinnacle Banking", "AI in SDLC")
        );

        employeeRepository.saveAll(employees);
        log.info("Seeded 10 employees successfully");
    }

    private Employee buildEmployee(String username, String name, String email,
                                   String hash, Designation designation, String department,
                                   LocalDate joiningDate, String account, String project) {
        return Employee.builder()
                .username(username)
                .name(name)
                .email(email)
                .passwordHash(hash)
                .designation(designation)
                .department(department)
                .account(account)
                .project(project)
                .joiningDate(joiningDate)
                .active(true)
                .build();
    }
}
