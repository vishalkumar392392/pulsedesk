package com.pulsedesk.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import com.pulsedesk.modal.AssetsModal;

@SpringBootTest
@Transactional
class AssetServiceTests {

	@Autowired
	private AssetService assetService;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Test
	void assignsAndUnassignsAnAssetInOneTransaction() {
		Integer assetId = jdbcTemplate.queryForObject("""
				SELECT id
				FROM assets
				WHERE assigned_to_id IS NULL
				  AND status <> 'RETIRED'
				ORDER BY id
				LIMIT 1
				""", Integer.class);
		Map<String, Object> user = jdbcTemplate.queryForMap("""
				SELECT user_id, email
				FROM users
				WHERE status = 'ACTIVE'
				ORDER BY user_id
				LIMIT 1
				""");
		Integer userId = ((Number) user.get("user_id")).intValue();
		String email = (String) user.get("email");

		AssetsModal assigned = assetService.assignAsset(assetId, userId, email);

		assertThat(assigned.getAssignedToId()).isEqualTo(userId);
		assertThat(assigned.getStatus()).isEqualTo("IN_USE");
		assertThat(jdbcTemplate.queryForObject(
				"SELECT COUNT(*) FROM asset_assignment_history WHERE asset_id = ? AND unassigned_at IS NULL",
				Integer.class, assetId)).isEqualTo(1);

		AssetsModal unassigned = assetService.assignAsset(assetId, null, email);

		assertThat(unassigned.getAssignedToId()).isNull();
		assertThat(unassigned.getAssignedTo()).isNull();
		assertThat(unassigned.getStatus()).isEqualTo("IN_STOCK");
		assertThat(jdbcTemplate.queryForObject(
				"SELECT COUNT(*) FROM asset_assignment_history WHERE asset_id = ? AND unassigned_at IS NULL",
				Integer.class, assetId)).isZero();
	}

}
