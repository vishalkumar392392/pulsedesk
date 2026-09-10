package com.pulsedesk.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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
			    t.resolved_at,
			    t.created_at
			FROM tickets t
			JOIN users u ON u.user_id = t.requester_id
			WHERE (:scopeToRequester = 0 OR u.email = :email)
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
					WHERE (:scopeToRequester = 0 OR u.email = :email)
					  AND (:status IS NULL OR t.status = :status)
					  AND (:priority IS NULL OR t.priority = :priority)
					""",
			nativeQuery = true)
	Page<TicketEntity> getTickets(
			@Param("email") String email,
			@Param("scopeToRequester") int scopeToRequester,
			@Param("status") String status,
			@Param("priority") String priority,
			@Param("sort") String sort,
			@Param("direction") String direction,
			Pageable pageable);

	@Query(value = "select * from tickets", nativeQuery = true)
	List<TicketEntity> getAllTickets();

	@Query(value = """
			SELECT
			    t.id AS id,
			    t.title AS title,
			    t.description AS description,
			    t.category AS category,
			    t.priority AS priority,
			    t.status AS status,
			    t.requester_id AS requesterId,
			    requester.name AS requesterName,
			    t.assignee_id AS assigneeId,
			    assignee.name AS assigneeName,
			    t.created_at AS createdAt,
			    t.resolved_at AS resolvedAt
			FROM tickets t
			JOIN users requester ON requester.user_id = t.requester_id
			LEFT JOIN users assignee ON assignee.user_id = t.assignee_id
			WHERE t.id = :ticketId
			""", nativeQuery = true)
	Optional<TicketDetailsProjection> getTicketDetails(@Param("ticketId") Integer ticketId);

	@Query(value = """
			SELECT
			    u.user_id AS id,
			    u.name AS name,
			    u.email AS email
			FROM users u
			JOIN role r ON r.id = u.role_id
			WHERE u.status = 'ACTIVE'
			  AND LOWER(r.name) = 'agent'
			ORDER BY u.name ASC, u.user_id ASC
			""", nativeQuery = true)
	List<TicketAssigneeProjection> getAssignableAgents();

	@Query(value = """
			SELECT COUNT(*)
			FROM users u
			JOIN role r ON r.id = u.role_id
			WHERE u.user_id = :userId
			  AND u.status = 'ACTIVE'
			  AND LOWER(r.name) = 'agent'
			""", nativeQuery = true)
	long countAssignableAgent(@Param("userId") Integer userId);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query(value = """
			UPDATE tickets
			SET status = :status,
			    resolved_at = CASE
			        WHEN :status IN ('RESOLVED', 'CLOSED') THEN COALESCE(resolved_at, CURRENT_TIMESTAMP(6))
			        ELSE NULL
			    END,
			    updated_at = CURRENT_TIMESTAMP(6),
			    version = version + 1
			WHERE id = :ticketId
			""", nativeQuery = true)
	int updateTicketStatus(@Param("ticketId") Integer ticketId, @Param("status") String status);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query(value = """
			UPDATE tickets
			SET assignee_id = :assigneeId,
			    updated_at = CURRENT_TIMESTAMP(6),
			    version = version + 1
			WHERE id = :ticketId
			""", nativeQuery = true)
	int updateTicketAssignee(@Param("ticketId") Integer ticketId, @Param("assigneeId") Integer assigneeId);

}
