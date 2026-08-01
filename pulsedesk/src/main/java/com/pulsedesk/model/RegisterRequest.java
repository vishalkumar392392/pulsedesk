package com.pulsedesk.model;

import lombok.Data;

@Data
public class RegisterRequest {

    private String name;
    private String email;
    private String mobileNumber;
    private String pwd;
    private String role; // "admin", "employee", "agent"

}
