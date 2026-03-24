package com.collabrix.controller;

import com.collabrix.dto.request.GiveFeedbackRequest;
import com.collabrix.dto.request.RequestFeedbackDto;
import com.collabrix.dto.response.FeedbackDto;
import com.collabrix.entity.Employee;
import com.collabrix.exception.ResourceNotFoundException;
import com.collabrix.exception.UnauthorizedAccessException;
import com.collabrix.repository.EmployeeRepository;
import com.collabrix.service.FeedbackService;
import com.collabrix.util.DesignationUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final EmployeeRepository employeeRepository;
    private final DesignationUtil designationUtil;

    @PostMapping("/give")
    public ResponseEntity<FeedbackDto> giveFeedback(@Valid @RequestBody GiveFeedbackRequest request) {
        return ResponseEntity.ok(feedbackService.giveFeedback(getCurrentEmployeeId(), request));
    }

    @PostMapping("/request")
    public ResponseEntity<Void> requestFeedback(@Valid @RequestBody RequestFeedbackDto request) {
        feedbackService.requestFeedback(getCurrentEmployeeId(), request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/received")
    public ResponseEntity<List<FeedbackDto>> getReceivedFeedback() {
        return ResponseEntity.ok(feedbackService.getReceivedFeedback(getCurrentEmployeeId()));
    }

    @GetMapping("/given")
    public ResponseEntity<List<FeedbackDto>> getGivenFeedback() {
        return ResponseEntity.ok(feedbackService.getGivenFeedback(getCurrentEmployeeId()));
    }

    @GetMapping("/received/{employeeId}")
    public ResponseEntity<List<FeedbackDto>> getReceivedFeedbackForEmployee(@PathVariable Long employeeId) {
        Long currentId = getCurrentEmployeeId();
        Employee requester = employeeRepository.findById(currentId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        Employee target = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (!designationUtil.isSeniorTo(requester.getDesignation(), target.getDesignation())) {
            throw new UnauthorizedAccessException("You do not have permission to view this employee's feedback");
        }

        return ResponseEntity.ok(feedbackService.getReceivedFeedback(employeeId));
    }

    @GetMapping("/pending-requests")
    public ResponseEntity<List<FeedbackDto>> getPendingFeedbackRequests() {
        return ResponseEntity.ok(feedbackService.getPendingFeedbackRequests(getCurrentEmployeeId()));
    }

    private Long getCurrentEmployeeId() {
        return Long.parseLong((String) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }
}
