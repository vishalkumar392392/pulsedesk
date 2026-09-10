DROP PROCEDURE IF EXISTS `create_ticket`;

DELIMITER $$

CREATE PROCEDURE `create_ticket`(
    IN p_title VARCHAR(100),
    IN p_description TEXT,
    IN p_category VARCHAR(20),
    IN p_priority VARCHAR(10),
    IN p_requester_email VARCHAR(255),
    IN p_asset_ids_json LONGTEXT
)
BEGIN
    DECLARE v_requester_id INT DEFAULT NULL;
    DECLARE v_ticket_id BIGINT;

    SELECT u.user_id
      INTO v_requester_id
      FROM users u
     WHERE u.email = p_requester_email
     LIMIT 1;

    IF v_requester_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No user found for the supplied email';
    END IF;

    INSERT INTO tickets (
        title,
        description,
        category,
        priority,
        requester_id
    ) VALUES (
        p_title,
        p_description,
        p_category,
        p_priority,
        v_requester_id
    );

    SET v_ticket_id = LAST_INSERT_ID();

    IF p_asset_ids_json IS NOT NULL
       AND JSON_LENGTH(p_asset_ids_json) > 0 THEN
        INSERT INTO ticket_assets (ticket_id, asset_id)
        SELECT
            v_ticket_id,
            asset_ids.asset_id
        FROM JSON_TABLE(
            p_asset_ids_json,
            '$[*]' COLUMNS (
                asset_id BIGINT PATH '$'
            )
        ) AS asset_ids;
    END IF;

    SELECT
        u.user_id,
        u.name,
        u.email,
        u.mobile_number,
        u.pwd,
        u.create_dt,
        u.status,
        u.role_id,
        v_ticket_id AS ticket_id
    FROM users u
    WHERE u.user_id = v_requester_id;
END$$

DELIMITER ;
