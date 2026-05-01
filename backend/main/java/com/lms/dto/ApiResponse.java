package com.lms.dto;

public class ApiResponse<T> {

    private String code;
    private String message;
    private T data;
    private Object pagination;

    public static <T> ApiResponse<T> success(String message, T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode("SUCCESS");
        response.setMessage(message);
        response.setData(data);
        return response;
    }

    public static <T> ApiResponse<T> success(String message, T data, Object pagination) {
        ApiResponse<T> response = success(message, data);
        response.setPagination(pagination);
        return response;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public Object getPagination() {
        return pagination;
    }

    public void setPagination(Object pagination) {
        this.pagination = pagination;
    }
}
