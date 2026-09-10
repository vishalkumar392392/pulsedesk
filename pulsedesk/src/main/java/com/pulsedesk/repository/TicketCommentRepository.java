package com.pulsedesk.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pulsedesk.entites.TicketCommentEntity;

public interface TicketCommentRepository extends JpaRepository<TicketCommentEntity, Long> {

	@Query(value = """
			SELECT
			    c.id AS id,
			    c.ticket_id AS ticketId,
			    c.author_id AS authorId,
			    u.name AS authorName,
			    c.body AS body,
			    c.created_at AS createdAt
			FROM comments c
			JOIN users u ON u.user_id = c.author_id
			WHERE c.ticket_id = :ticketId
			ORDER BY c.created_at ASC, c.id ASC
			""", nativeQuery = true)
	List<TicketCommentProjection> getComments(@Param("ticketId") Integer ticketId);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query(value = """
			INSERT INTO comments (ticket_id, author_id, body, created_at)
			VALUES (:ticketId, :authorId, :body, CURRENT_TIMESTAMP(6))
			""", nativeQuery = true)
	int createComment(@Param("ticketId") Integer ticketId, @Param("authorId") Integer authorId,
			@Param("body") String body);
}
