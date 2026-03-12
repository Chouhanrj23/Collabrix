package com.collabrix.config;

import com.collabrix.entity.Employee;
import com.collabrix.enums.Designation;
import com.collabrix.enums.Grade;
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

        List<Employee> employees = List.of(
                buildEmployee("dilip", "Dilip Srinivas", "dilip@collabrix.com",
                        hash, Designation.DIRECTOR, "Collabrix Internal", "Firm Leadership",
                        LocalDate.of(2016, 4, 1)),
                buildEmployee("sankara", "T Sankara Subramanian", "sankara@collabrix.com",
                        hash, Designation.PARTNER, "TechCorp India", "ERP Modernisation",
                        LocalDate.of(2017, 8, 15)),
                buildEmployee("malli", "Mallikarjun Kandkuru", "malli@collabrix.com",
                        hash, Designation.PARTNER, "FinServ Ltd", "Risk Analytics Platform",
                        LocalDate.of(2018, 1, 10)),
                buildEmployee("kratika", "Kratika Sharma", "kratika@collabrix.com",
                        hash, Designation.MANAGER, "TechCorp India", "ERP Modernisation",
                        LocalDate.of(2019, 3, 20)),
                buildEmployee("karthik", "Karthik Pai", "karthik@collabrix.com",
                        hash, Designation.MANAGER, "FinServ Ltd", "Risk Analytics Platform",
                        LocalDate.of(2019, 7, 1)),
                buildEmployee("hiren", "Hiren Shah", "hiren@collabrix.com",
                        hash, Designation.MANAGER, "RetailX", "Digital Commerce",
                        LocalDate.of(2020, 2, 14)),
                buildEmployee("raj", "Raj Chouhan", "raj@collabrix.com",
                        hash, Designation.CONSULTANT, "TechCorp India", "ERP Modernisation",
                        LocalDate.of(2021, 6, 1)),
                buildEmployee("praveen", "Praveen Agarwal", "praveen@collabrix.com",
                        hash, Designation.CONSULTANT, "FinServ Ltd", "Risk Analytics Platform",
                        LocalDate.of(2021, 9, 15)),
                buildEmployee("neha", "Neha Gupta", "neha@collabrix.com",
                        hash, Designation.SENIOR_CONSULTANT, "RetailX", "Digital Commerce",
                        LocalDate.of(2022, 3, 7)),
                buildEmployee("gagan", "Gagan Yadav", "gagan@collabrix.com",
                        hash, Designation.ASSOCIATE_CONSULTANT, "TechCorp India", "ERP Modernisation",
                        LocalDate.of(2023, 8, 21))
        );

        employeeRepository.saveAll(employees);
        log.info("Seeded 10 employees successfully");
    }

    private Employee buildEmployee(String username, String name, String email,
                                   String hash, Designation designation, String account,
                                   String project, LocalDate joiningDate) {
        return Employee.builder()
                .username(username)
                .name(name)
                .email(email)
                .passwordHash(hash)
                .designation(designation)
                .grade(Grade.fromDesignation(designation))
                .account(account)
                .project(project)
                .joiningDate(joiningDate)
                .active(true)
                .build();
    }
}
