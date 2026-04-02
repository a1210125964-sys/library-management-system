package com.lms.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NoticeRequestValidationTest {

    private static ValidatorFactory validatorFactory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        if (validatorFactory != null) {
            validatorFactory.close();
        }
    }

    @Test
    void should_reject_title_longer_than_255() {
        String longTitle = "T".repeat(256);
        NoticeRequest req = new NoticeRequest(longTitle, "摘要", "正文", true);

        boolean hasTitleSizeViolation = validator.validate(req).stream()
                .anyMatch(v -> "title".equals(v.getPropertyPath().toString()));

        assertTrue(hasTitleSizeViolation);
    }

    @Test
    void should_reject_summary_longer_than_500() {
        String longSummary = "S".repeat(501);
        NoticeRequest req = new NoticeRequest("标题", longSummary, "正文", true);

        boolean hasSummarySizeViolation = validator.validate(req).stream()
                .anyMatch(v -> "summary".equals(v.getPropertyPath().toString()));

        assertTrue(hasSummarySizeViolation);
    }

    @Test
    void should_accept_title_255_and_summary_500() {
        String maxTitle = "T".repeat(255);
        String maxSummary = "S".repeat(500);
        NoticeRequest req = new NoticeRequest(maxTitle, maxSummary, "正文", true);

        boolean hasLengthViolation = validator.validate(req).stream()
                .anyMatch(v -> "title".equals(v.getPropertyPath().toString()) || "summary".equals(v.getPropertyPath().toString()));

        assertFalse(hasLengthViolation);
    }
}
