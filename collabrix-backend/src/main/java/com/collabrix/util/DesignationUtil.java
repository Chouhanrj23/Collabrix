package com.collabrix.util;

import com.collabrix.enums.Designation;
import org.springframework.stereotype.Component;

@Component
public class DesignationUtil {

    public boolean canGiveFeedbackTo(Designation giver, Designation receiver) {
        return giver.getHierarchyLevel() >= receiver.getHierarchyLevel();
    }

    public boolean canViewConnections(Designation viewer, Designation target) {
        return viewer.getHierarchyLevel() >= target.getHierarchyLevel();
    }

    public boolean isSeniorTo(Designation a, Designation b) {
        return a.getHierarchyLevel() > b.getHierarchyLevel();
    }
}
