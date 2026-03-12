package com.collabrix.controller;

import com.collabrix.dto.request.GiveFeedbackRequest;
import com.collabrix.dto.request.RequestFeedbackDto;
import com.collabrix.dto.response.FeedbackDto;
import com.collabrix.service.FeedbackService;
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

    @GetMapping("/pending-requests")
    public ResponseEntity<List<FeedbackDto>> getPendingFeedbackRequests() {
        return ResponseEntity.ok(feedbackService.getPendingFeedbackRequests(getCurrentEmployeeId()));
    }

    private Long getCurrentEmployeeId() {
        return Long.parseLong((String) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }
}
