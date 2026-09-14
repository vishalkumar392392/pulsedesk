CREATE TABLE IF NOT EXISTS notifications
(
    id                BIGINT      NOT NULL AUTO_INCREMENT,
    recipient_user_id INT         NOT NULL,
    type              VARCHAR(40) NOT NULL,
    ticket_id         BIGINT      NOT NULL,
    comment_id        BIGINT      NOT NULL,
    message           TEXT        NOT NULL,
    read_at           DATETIME(6) NULL,
    created_at        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),

    CONSTRAINT fk_notifications_recipient
        FOREIGN KEY (recipient_user_id) REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_notifications_ticket
        FOREIGN KEY (ticket_id) REFERENCES tickets (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_notifications_comment
        FOREIGN KEY (comment_id) REFERENCES comments (id)
        ON DELETE CASCADE,
    CONSTRAINT uq_notifications_comment_recipient
        UNIQUE (recipient_user_id, comment_id, type),
    CONSTRAINT chk_notifications_type
        CHECK (BINARY type IN ('TICKET_COMMENT_ADDED')),

    INDEX idx_notifications_recipient_unread_created
        (recipient_user_id, read_at, created_at, id),
    INDEX idx_notifications_recipient_ticket_unread
        (recipient_user_id, ticket_id, read_at)
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;
