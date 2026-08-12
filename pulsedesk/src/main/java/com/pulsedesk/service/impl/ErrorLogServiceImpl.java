package com.pulsedesk.service.impl;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.pulsedesk.entites.ErrorLogEntity;
import com.pulsedesk.repository.ErrorLogRepository;
import com.pulsedesk.service.ErrorLogService;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class ErrorLogServiceImpl implements ErrorLogService {

    private static final Logger log = LoggerFactory.getLogger(ErrorLogServiceImpl.class);

    private final ErrorLogRepository errorLogRepository;

    public ErrorLogServiceImpl(ErrorLogRepository errorLogRepository) {
        this.errorLogRepository = errorLogRepository;
    }

    @Override
    public String logError(Exception ex, HttpServletRequest request) {
        try {
            ErrorLogEntity entity = new ErrorLogEntity();
            entity.setExceptionClass(ex.getClass().getName());
            entity.setMessage(ex.getMessage());
            entity.setStackTrace(toStackTrace(ex));
            entity.setRequestUri(request.getRequestURI());
            entity.setRequestMethod(request.getMethod());
            entity.setOccurredAt(LocalDateTime.now());

            return errorLogRepository.save(entity).getId();
        } catch (Exception saveEx) {
            // DB unavailable — fall back to console so the original 500 still gets a
            // response
            log.error("Failed to persist error log: {}", saveEx.getMessage(), saveEx);
            return "N/A";
        }
    }

    private String toStackTrace(Exception ex) {
        StringWriter sw = new StringWriter();
        ex.printStackTrace(new PrintWriter(sw));
        return sw.toString();
    }
}
