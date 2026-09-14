package com.pulsedesk.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
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

}
