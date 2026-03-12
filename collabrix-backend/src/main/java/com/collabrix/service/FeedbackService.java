package com.collabrix.service;

import com.collabrix.dto.request.GiveFeedbackRequest;
import com.collabrix.dto.request.RequestFeedbackDto;
import com.collabrix.dto.response.EmployeeDto;
import com.collabrix.dto.response.FeedbackDto;
import com.collabrix.entity.Employee;
import com.collabrix.entity.FeedbackRelationship;
import com.collabrix.entity.FeedbackRequest;
import com.collabrix.exception.HierarchyViolationException;
import com.collabrix.exception.ResourceNotFoundException;
import com.collabrix.repository.EmployeeRepository;
import com.collabrix.repository.FeedbackRepository;
import com.collabrix.repository.FeedbackRequestRepository;
import com.collabrix.util.DesignationUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackRequestRepository feedbackRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final DesignationUtil designationUtil;

    public FeedbackDto giveFeedback(Long fromEmployeeId, GiveFeedbackRequest request) {
        Employee giver = employeeRepository.findById(fromEmployeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Giver employee not found"));
        Employee receiver = employeeRepository.findById(request.toEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver employee not found"));

        if (!designationUtil.canGiveFeedbackTo(giver.getDesignation(), receiver.getDesignation())) {
            throw new HierarchyViolationException("You cannot give feedback to a senior employee");
        }

        FeedbackRelationship feedback = FeedbackRelationship.builder()
                .fromEmployeeId(fromEmployeeId)
                .toEmployeeId(request.toEmployeeId())
                .rating(request.rating())
                .comment(request.comment())
                .feedbackDate(LocalDate.now())
                .isResponse(request.requestId() != null)
                .requestId(request.requestId())
                .build();

        FeedbackRelationship saved = feedbackRepository.save(feedback);

        // Mark feedback request as fulfilled if requestId is present
        if (request.requestId() != null) {
            feedbackRequestRepository.findById(request.requestId()).ifPresent(fr -> {
                fr.setFulfilled(true);
                fr.setFulfilledAt(LocalDateTime.now());
                feedbackRequestRepository.save(fr);
            });
        }

        return toFeedbackDto(saved, giver, receiver);
    }

    public void requestFeedback(Long requesterId, RequestFeedbackDto dto) {
        Employee requester = employeeRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Requester not found"));
        Employee target = employeeRepository.findByEmail(dto.requestFromEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email: " + dto.requestFromEmail()));

        FeedbackRequest feedbackRequest = FeedbackRequest.builder()
                .requestedByEmployeeId(requesterId)
                .requestedFromEmployeeId(target.getId())
                .message(dto.message())
                .fulfilled(false)
                .requestedAt(LocalDateTime.now())
                .build();

        feedbackRequestRepository.save(feedbackRequest);
    }

    public List<FeedbackDto> getReceivedFeedback(Long employeeId) {
        return feedbackRepository.findByToEmployeeId(employeeId).stream()
                .map(this::toFeedbackDto)
                .toList();
    }

    public List<FeedbackDto> getPendingFeedbackRequests(Long employeeId) {
        return feedbackRequestRepository.findByRequestedFromEmployeeIdAndFulfilledFalse(employeeId).stream()
                .map(fr -> {
                    Employee requester = employeeRepository.findById(fr.getRequestedByEmployeeId())
                            .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
                    Employee target = employeeRepository.findById(fr.getRequestedFromEmployeeId())
                            .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
                    return new FeedbackDto(
                            fr.getId(),
                            EmployeeDto.from(requester),
                            EmployeeDto.from(target),
                            null,
                            fr.getMessage(),
                            null
                    );
                })
                .toList();
    }

    private FeedbackDto toFeedbackDto(FeedbackRelationship feedback) {
        Employee from = employeeRepository.findById(feedback.getFromEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        Employee to = employeeRepository.findById(feedback.getToEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return toFeedbackDto(feedback, from, to);
    }

    private FeedbackDto toFeedbackDto(FeedbackRelationship feedback, Employee from, Employee to) {
        return new FeedbackDto(
                feedback.getId(),
                EmployeeDto.from(from),
                EmployeeDto.from(to),
                feedback.getRating(),
                feedback.getComment(),
                feedback.getFeedbackDate()
        );
    }
}
