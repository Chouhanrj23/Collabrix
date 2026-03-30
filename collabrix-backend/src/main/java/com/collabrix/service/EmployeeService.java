package com.collabrix.service;

import com.collabrix.dto.response.EmployeeDto;
import com.collabrix.entity.Employee;
import com.collabrix.exception.ResourceNotFoundException;
import com.collabrix.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    private final EmployeeRepository employeeRepository;

    @Value("${collabrix.uploads.dir:uploads/profile-pics}")
    private String uploadDir;

    public List<EmployeeDto> getAllEmployees() {
        return employeeRepository.findAll().stream()
                .map(EmployeeDto::from)
                .toList();
    }

    public EmployeeDto getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        return EmployeeDto.from(employee);
    }

    public Employee getEmployeeEntityById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    public List<String> getDistinctDepartments() {
        return employeeRepository.findDistinctDepartments();
    }

    public List<EmployeeDto> getDirectReportees(Long managerId) {
        return employeeRepository.findDirectReportees(managerId).stream()
                .map(EmployeeDto::from)
                .toList();
    }

    public List<EmployeeDto> searchEmployees(String query) {
        return employeeRepository.findByNameOrEmailContaining(query).stream()
                .map(EmployeeDto::from)
                .toList();
    }

    public String uploadProfilePicture(Long employeeId, MultipartFile file) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));

        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds 5MB limit");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only JPEG, PNG, and WebP images are allowed");
        }

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String extension = contentType.equals("image/png") ? ".png"
                    : contentType.equals("image/webp") ? ".webp" : ".jpg";
            String fileName = employeeId + "-" + UUID.randomUUID().toString().substring(0, 8) + extension;

            Path targetPath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String profileUrl = "/uploads/profile-pics/" + fileName;
            employee.setProfileImageUrl(profileUrl);
            employeeRepository.save(employee);

            return profileUrl;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store profile picture", e);
        }
    }
}
