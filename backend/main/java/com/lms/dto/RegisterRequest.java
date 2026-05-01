package com.lms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    @NotBlank
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank
    @Size(min = 2, max = 50)
    private String realName;

    @NotBlank
    @Size(min = 6, max = 30)
    private String password;

    @NotBlank
    @Pattern(regexp = "^1\\d{10}$", message = "联系方式格式不正确")
    private String phone;

    @NotBlank
    @Pattern(regexp = "^\\d{15}(\\d{2}[0-9Xx])?$", message = "身份证号格式不正确")
    private String idCard;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRealName() {
        return realName;
    }

    public void setRealName(String realName) {
        this.realName = realName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getIdCard() {
        return idCard;
    }

    public void setIdCard(String idCard) {
        this.idCard = idCard;
    }
}
