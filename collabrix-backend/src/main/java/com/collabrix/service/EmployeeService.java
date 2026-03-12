package com.collabrix.service;

import com.collabrix.dto.response.EmployeeDto;
import com.collabrix.entity.Employee;
import com.collabrix.exception.ResourceNotFoundException;
import com.collabrix.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

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

    public List<String> getDistinctAccounts() {
        return employeeRepository.findDistinctAccounts();
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
}
