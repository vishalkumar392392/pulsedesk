package com.pulsedesk.repository;

import java.util.List;

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
			    t.created_at
			FROM tickets t
			JOIN users u ON u.user_id = t.requester_id
			WHERE u.email = :email
			ORDER BY t.created_at DESC
			""", nativeQuery = true)
	List<TicketEntity> getTickets(@Param("email") String email);

}
