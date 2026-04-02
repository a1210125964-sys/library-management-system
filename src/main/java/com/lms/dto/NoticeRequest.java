package com.lms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class NoticeRequest {

    @NotBlank
    @Size(max = 255)
    private String title;

    @Size(max = 500)
    private String summary;

    @NotBlank
    private String content;

    private Boolean published;

    public NoticeRequest() {
    }

    public NoticeRequest(String title, String summary, String content, Boolean published) {
        this.title = title;
        this.summary = summary;
        this.content = content;
        this.published = published;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Boolean getPublished() {
        return published;
    }

    public void setPublished(Boolean published) {
        this.published = published;
    }
}