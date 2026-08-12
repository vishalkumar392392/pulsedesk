package com.pulsedesk.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pulsedesk.entites.ErrorLogEntity;

public interface ErrorLogRepository extends JpaRepository<ErrorLogEntity, String> {
}
