package com.pulsedesk.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pulsedesk.entites.TicketEntity;
import com.pulsedesk.entites.UserEntity;

public interface TicketRepository extends JpaRepository<TicketEntity, Integer> {

	@Query(value = """
			CALL create_ticket(
				:title,
				:description,
				:category,
				:priority,
				:requesterEmail,
				:assetIdsJson
			)
			""", nativeQuery = true)
	UserEntity createTicket(
			@Param("title") String title,
			@Param("description") String description,
			@Param("category") String category,
			@Param("priority") String priority,
			@Param("requesterEmail") String requesterEmail,
			@Param("assetIdsJson") String assetIdsJson);

	@Query(value = """
			SELECT
			    t.id,
			    t.title,
			    t.description,
			    t.category,
			    t.priority,
			    t.status,
			    t.requester_id,
			    t.assignee_id,
			    t.created_at
			FROM tickets t
			JOIN users u ON u.user_id = t.requester_id
			WHERE u.email = :email
			  AND (:status IS NULL OR t.status = :status)
			  AND (:priority IS NULL OR t.priority = :priority)
			ORDER BY
			    CASE WHEN :sort = 'id' AND :direction = 'asc' THEN t.id END ASC,
			    CASE WHEN :sort = 'id' AND :direction = 'desc' THEN t.id END DESC,
			    CASE WHEN :sort = 'title' AND :direction = 'asc' THEN t.title END ASC,
			    CASE WHEN :sort = 'title' AND :direction = 'desc' THEN t.title END DESC,
			    CASE WHEN :sort = 'status' AND :direction = 'asc' THEN t.status END ASC,
			    CASE WHEN :sort = 'status' AND :direction = 'desc' THEN t.status END DESC,
			    CASE WHEN :sort = 'priority' AND :direction = 'asc' THEN t.priority END ASC,
			    CASE WHEN :sort = 'priority' AND :direction = 'desc' THEN t.priority END DESC,
			    CASE WHEN :sort = 'assigneeId' AND :direction = 'asc' THEN t.assignee_id END ASC,
			    CASE WHEN :sort = 'assigneeId' AND :direction = 'desc' THEN t.assignee_id END DESC,
			    CASE WHEN :sort = 'createdAt' AND :direction = 'asc' THEN t.created_at END ASC,
			    CASE WHEN :sort = 'createdAt' AND :direction = 'desc' THEN t.created_at END DESC,
			    t.created_at DESC,
			    t.id DESC
			""",
			countQuery = """
					SELECT COUNT(*)
					FROM tickets t
					JOIN users u ON u.user_id = t.requester_id
					WHERE u.email = :email
					  AND (:status IS NULL OR t.status = :status)
					  AND (:priority IS NULL OR t.priority = :priority)
					""",
			nativeQuery = true)
	Page<TicketEntity> getTickets(
			@Param("email") String email,
			@Param("status") String status,
			@Param("priority") String priority,
			@Param("sort") String sort,
			@Param("direction") String direction,
			Pageable pageable);

}
