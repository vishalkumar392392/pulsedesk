package com.pulsedesk.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import com.pulsedesk.modal.AssetsModal;
import com.pulsedesk.modal.CreateAssetRequest;

@SpringBootTest
@Transactional
class AssetServiceTests {

	@Autowired
	private AssetService assetService;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Test
	void createsAnUnassignedInStockAssetWithNativeInsert() {
		String tag = "TEST-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
		CreateAssetRequest request = new CreateAssetRequest();
		request.setTag(tag);
		request.setType("laptop");
		request.setModel("Test Laptop");
		request.setPurchasedAt(LocalDate.of(2026, 9, 10));

		AssetsModal created = assetService.createAsset(request);

		assertThat(created.getId()).isNotNull();
		assertThat(created.getTag()).isEqualTo(tag);
		assertThat(created.getType()).isEqualTo("LAPTOP");
		assertThat(created.getStatus()).isEqualTo("IN_STOCK");
		assertThat(created.getAssignedToId()).isNull();
		assertThat(created.getAssignedTo()).isNull();
		assertThat(created.getPurchasedAt()).isEqualTo("2026-09-10");
		assertThat(created.getCoverageUntil()).isNull();
		assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM assets WHERE tag = ?", Integer.class, tag))
				.isEqualTo(1);
	}

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
