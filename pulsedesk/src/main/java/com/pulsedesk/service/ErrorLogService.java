package com.pulsedesk.service;

import jakarta.servlet.http.HttpServletRequest;

public interface ErrorLogService {
    String logError(Exception ex, HttpServletRequest request);
}
