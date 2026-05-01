package com.lms.dto;

import com.lms.model.UserRole;
import jakarta.validation.constraints.NotNull;

public class RoleUpdateRequest {
    @NotNull
    private UserRole role;

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }
}
