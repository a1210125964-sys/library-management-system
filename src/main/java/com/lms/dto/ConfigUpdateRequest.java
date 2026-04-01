package com.lms.dto;

import jakarta.validation.constraints.Min;

public class ConfigUpdateRequest {
    @Min(1)
    private Integer borrowDays;

    @Min(1)
    private Integer maxBorrowCount;

    @Min(0)
    private Double overdueDailyFee;

    public Integer getBorrowDays() {
        return borrowDays;
    }

    public void setBorrowDays(Integer borrowDays) {
        this.borrowDays = borrowDays;
    }

    public Integer getMaxBorrowCount() {
        return maxBorrowCount;
    }

    public void setMaxBorrowCount(Integer maxBorrowCount) {
        this.maxBorrowCount = maxBorrowCount;
    }

    public Double getOverdueDailyFee() {
        return overdueDailyFee;
    }

    public void setOverdueDailyFee(Double overdueDailyFee) {
        this.overdueDailyFee = overdueDailyFee;
    }
}
