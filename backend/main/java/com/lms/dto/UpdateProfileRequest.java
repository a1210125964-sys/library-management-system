package com.lms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UpdateProfileRequest {
    @NotBlank
    private String realName;

    @NotBlank
    @Pattern(regexp = "^1\\d{10}$", message = "联系方式格式不正确")
    private String phone;

    @NotBlank
    @Pattern(regexp = "^\\d{15}(\\d{2}[0-9Xx])?$", message = "身份证号格式不正确")
    private String idCard;

    public String getRealName() {
        return realName;
    }

    public void setRealName(String realName) {
        this.realName = realName;
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
