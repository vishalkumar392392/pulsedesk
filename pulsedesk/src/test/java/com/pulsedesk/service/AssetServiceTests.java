package com.pulsedesk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pulsedesk.entites.AssetsUserEntity;
import com.pulsedesk.exception.BadUserRequestException;
import com.pulsedesk.modal.AssetsModal;
import com.pulsedesk.modal.CreateAssetRequest;
import com.pulsedesk.repository.AssetsRepository;
import com.pulsedesk.repository.AssetsUserRepository;
import com.pulsedesk.repository.UserRepository;
import com.pulsedesk.service.impl.AssetServiceImpl;

@ExtendWith(MockitoExtension.class)
class AssetServiceTests {

	@Mock
	private AssetsRepository assetsRepository;

	@Mock
	private AssetsUserRepository assetsUserRepository;

	@Mock
	private UserRepository userRepository;

	@InjectMocks
	private AssetServiceImpl assetService;

	@Test
	void createsNormalizedAssetWithoutDatabase() {
		String tag = "test-asset-01";
		CreateAssetRequest request = new CreateAssetRequest();
		request.setTag(tag);
		request.setType("laptop");
		request.setModel("Test Laptop");
		request.setPurchasedAt(LocalDate.of(2026, 9, 10));
		when(assetsRepository.countByTag("TEST-ASSET-01")).thenReturn(0L);

		AssetsUserEntity storedAsset = new AssetsUserEntity();
		storedAsset.setId(42);
		storedAsset.setTag("TEST-ASSET-01");
		storedAsset.setType("LAPTOP");
		storedAsset.setModel("Test Laptop");
		storedAsset.setStatus("IN_STOCK");
		storedAsset.setPurchasedAt("2026-09-10");
		when(assetsUserRepository.getAssetByTag("TEST-ASSET-01")).thenReturn(Optional.of(storedAsset));

		AssetsModal created = assetService.createAsset(request);

		assertThat(created.getId()).isEqualTo(42);
		assertThat(created.getTag()).isEqualTo("TEST-ASSET-01");
		assertThat(created.getType()).isEqualTo("LAPTOP");
		assertThat(created.getStatus()).isEqualTo("IN_STOCK");
		assertThat(created.getAssignedToId()).isNull();
		assertThat(created.getAssignedTo()).isNull();
		assertThat(created.getPurchasedAt()).isEqualTo("2026-09-10");
		assertThat(created.getCoverageUntil()).isNull();
		verify(assetsRepository).createAsset("TEST-ASSET-01", "LAPTOP", "Test Laptop",
				LocalDate.of(2026, 9, 10), null);
	}

	@Test
	void rejectsDuplicateAssetTagBeforeCreatingAsset() {
		CreateAssetRequest request = new CreateAssetRequest();
		request.setTag("existing-tag");
		request.setType("laptop");
		request.setModel("Test Laptop");
		request.setPurchasedAt(LocalDate.of(2026, 9, 10));
		when(assetsRepository.countByTag("EXISTING-TAG")).thenReturn(1L);

		assertThatThrownBy(() -> assetService.createAsset(request))
				.isInstanceOf(BadUserRequestException.class)
				.hasMessage("An asset with tag 'EXISTING-TAG' already exists");

		verify(assetsRepository, never()).createAsset(any(), any(), any(), any(), eq(null));
	}

}
