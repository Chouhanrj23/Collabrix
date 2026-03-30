package com.collabrix.service;

import com.collabrix.dto.request.GiveFeedbackRequest;
import com.collabrix.dto.request.RequestFeedbackDto;
import com.collabrix.dto.response.FeedbackDto;
import com.collabrix.entity.Employee;
import com.collabrix.entity.FeedbackRelationship;
import com.collabrix.entity.FeedbackRequest;
import com.collabrix.enums.Designation;
import com.collabrix.enums.Grade;
import com.collabrix.exception.HierarchyViolationException;
import com.collabrix.repository.EmployeeRepository;
import com.collabrix.repository.FeedbackRepository;
import com.collabrix.repository.FeedbackRequestRepository;
import com.collabrix.util.DesignationUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeedbackServiceTest {

    @Mock
    private FeedbackRepository feedbackRepository;

    @Mock
    private FeedbackRequestRepository feedbackRequestRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DesignationUtil designationUtil;

    @InjectMocks
    private FeedbackService feedbackService;

    private Employee buildEmployee(Long id, String name, Designation designation) {
        return Employee.builder()
                .id(id)
                .username(name.toLowerCase().split(" ")[0])
                .name(name)
                .email(name.toLowerCase().split(" ")[0] + "@collabrix.com")
                .passwordHash("hash")
                .designation(designation)
                .grade(Grade.fromDesignation(designation))
                .department("Software Engineering")
                .joiningDate(LocalDate.of(2020, 1, 1))
                .active(true)
                .build();
    }

    @Test
    void giveFeedback_managerToConsultant_succeeds() {
        Employee manager = buildEmployee(1L, "Kratika Sharma", Designation.MANAGER);
        Employee consultant = buildEmployee(2L, "Raj Chouhan", Designation.CONSULTANT);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(manager));
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(designationUtil.canGiveFeedbackTo(Designation.MANAGER, Designation.CONSULTANT)).thenReturn(true);

        FeedbackRelationship saved = FeedbackRelationship.builder()
                .id(10L)
                .fromEmployeeId(1L)
                .toEmployeeId(2L)
                .rating(5)
                .comment("Great work")
                .feedbackDate(LocalDate.now())
                .isResponse(false)
                .build();
        when(feedbackRepository.save(any(FeedbackRelationship.class))).thenReturn(saved);

        GiveFeedbackRequest request = new GiveFeedbackRequest(2L, 5, "Great work", null);
        FeedbackDto result = feedbackService.giveFeedback(1L, request);

        assertNotNull(result);
        assertEquals(5, result.rating());
        assertEquals("Kratika Sharma", result.fromEmployee().name());
    }

    @Test
    void giveFeedback_consultantToManager_throwsHierarchyViolationException() {
        Employee consultant = buildEmployee(2L, "Raj Chouhan", Designation.CONSULTANT);
        Employee manager = buildEmployee(1L, "Kratika Sharma", Designation.MANAGER);

        when(employeeRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(manager));
        when(designationUtil.canGiveFeedbackTo(Designation.CONSULTANT, Designation.MANAGER)).thenReturn(false);

        GiveFeedbackRequest request = new GiveFeedbackRequest(1L, 4, "Good manager", null);

        assertThrows(HierarchyViolationException.class,
                () -> feedbackService.giveFeedback(2L, request));
    }

    @Test
    void giveFeedback_sameLevelPeer_succeeds() {
        Employee peer1 = buildEmployee(1L, "Raj Chouhan", Designation.CONSULTANT);
        Employee peer2 = buildEmployee(2L, "Praveen Agarwal", Designation.CONSULTANT);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(peer1));
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(peer2));
        when(designationUtil.canGiveFeedbackTo(Designation.CONSULTANT, Designation.CONSULTANT)).thenReturn(true);

        FeedbackRelationship saved = FeedbackRelationship.builder()
                .id(11L)
                .fromEmployeeId(1L)
                .toEmployeeId(2L)
                .rating(4)
                .comment("Solid peer")
                .feedbackDate(LocalDate.now())
                .isResponse(false)
                .build();
        when(feedbackRepository.save(any(FeedbackRelationship.class))).thenReturn(saved);

        GiveFeedbackRequest request = new GiveFeedbackRequest(2L, 4, "Solid peer", null);
        FeedbackDto result = feedbackService.giveFeedback(1L, request);

        assertNotNull(result);
        assertEquals(4, result.rating());
    }

    @Test
    void requestFeedback_anyHierarchy_succeeds() {
        Employee requester = buildEmployee(1L, "Raj Chouhan", Designation.CONSULTANT);
        Employee target = buildEmployee(2L, "Kratika Sharma", Designation.MANAGER);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(requester));
        when(employeeRepository.findByEmail("kratika@collabrix.com")).thenReturn(Optional.of(target));
        when(feedbackRequestRepository.save(any(FeedbackRequest.class))).thenReturn(
                FeedbackRequest.builder().id(1L).requestedByEmployeeId(1L).requestedFromEmployeeId(2L).build()
        );

        assertDoesNotThrow(() -> feedbackService.requestFeedback(1L,
                new RequestFeedbackDto("kratika@collabrix.com", "Please review my work")));

        verify(feedbackRequestRepository).save(any(FeedbackRequest.class));
    }
}
