package com.pulsedesk.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class NotificationServiceTests {

	@Test
	void requesterCommentNotifiesAssignedAgent() {
		assertEquals(3, NotificationServiceImpl.resolveCommentRecipient(12, 12, 3));
	}

	@Test
	void supportCommentNotifiesRequester() {
		assertEquals(12, NotificationServiceImpl.resolveCommentRecipient(3, 12, 3));
	}

	@Test
	void requesterCommentOnUnassignedTicketDoesNotNotifyAnyone() {
		assertNull(NotificationServiceImpl.resolveCommentRecipient(12, 12, null));
	}

	@Test
	void userIsNeverNotifiedAboutTheirOwnComment() {
		assertNull(NotificationServiceImpl.resolveCommentRecipient(12, 12, 12));
	}
}
