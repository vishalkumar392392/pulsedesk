package com.pulsedesk.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pulsedesk.entites.NotificationEntity;
import com.pulsedesk.enums.NotificationType;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

	Page<NotificationEntity> findByRecipientUserIdOrderByCreatedAtDescIdDesc(Integer recipientUserId,
			Pageable pageable);

	Page<NotificationEntity> findByRecipientUserIdAndReadAtIsNullOrderByCreatedAtDescIdDesc(Integer recipientUserId,
			Pageable pageable);

	long countByRecipientUserIdAndReadAtIsNull(Integer recipientUserId);

	Optional<NotificationEntity> findByIdAndRecipientUserId(Long id, Integer recipientUserId);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("""
			UPDATE NotificationEntity n
			SET n.readAt = :readAt
			WHERE n.recipientUserId = :recipientUserId
			  AND n.ticketId = :ticketId
			  AND n.type = :type
			  AND n.readAt IS NULL
			""")
	int markTicketNotificationsRead(@Param("recipientUserId") Integer recipientUserId,
			@Param("ticketId") Integer ticketId, @Param("type") NotificationType type,
			@Param("readAt") LocalDateTime readAt);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("""
			UPDATE NotificationEntity n
			SET n.readAt = :readAt
			WHERE n.recipientUserId = :recipientUserId
			  AND n.readAt IS NULL
			""")
	int markAllRead(@Param("recipientUserId") Integer recipientUserId, @Param("readAt") LocalDateTime readAt);
}
