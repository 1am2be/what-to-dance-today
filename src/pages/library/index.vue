<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import ArtistCard from "@/components/artist/ArtistCard.vue";
import ArtistDetailView from "@/components/artist/ArtistDetailView.vue";
import BottomNavigation from "@/components/base/BottomNavigation.vue";
import PageHeader from "@/components/base/PageHeader.vue";
import AddDanceSheet from "@/components/dance/AddDanceSheet.vue";
import TodayPracticeSheet from "@/components/dance/TodayPracticeSheet.vue";
import type { ArtistSummary } from "@/domain/models/artist";
import { useAppStore } from "@/stores/app";

const store = useAppStore();
const addSheetOpen = ref(false);
const practiceSheetOpen = ref(false);
const selectedArtistId = ref("");
const focusDanceId = ref("");
const totalDances = computed(() => store.dances.length);
const selectedArtist = computed(() => store.artistSummaries.find((artist) => artist.id === selectedArtistId.value));

onMounted(store.initialize);
onLoad((query) => {
  store.initialize();
  if (query?.artistId) selectedArtistId.value = String(query.artistId);
  if (query?.danceId) focusDanceId.value = String(query.danceId);
});

const openArtist = (artist: ArtistSummary) => {
  selectedArtistId.value = artist.id;
  focusDanceId.value = "";
};
</script>

<template>
  <view class="mobile-page library-page" :class="{ 'library-page--detail': selectedArtist }">
    <ArtistDetailView
      v-if="selectedArtist"
      :artist="selectedArtist"
      :focus-dance-id="focusDanceId"
      @back="selectedArtistId = ''"
      @deleted="selectedArtistId = ''; focusDanceId = ''"
    />

    <view v-else class="page-content">
      <PageHeader :eyebrow="`IDOL DANCE · ${totalDances} DANCE`" title="我的舞单" />

      <view class="library-actions">
        <button class="library-actions__button library-actions__button--review" @tap="practiceSheetOpen = true">
          <text class="library-actions__icon">✦</text>
          <text>今天复习什么</text>
        </button>
        <button class="library-actions__button library-actions__button--add" @tap="addSheetOpen = true">
          <text class="library-actions__icon">＋</text>
          <text>添加舞蹈</text>
        </button>
      </view>

      <view class="artist-grid">
        <ArtistCard
          v-for="artist in store.artistSummaries"
          :key="artist.id"
          :artist="artist"
          @select="openArtist"
        />
      </view>
    </view>

    <BottomNavigation active="library" />
    <AddDanceSheet :open="addSheetOpen" @close="addSheetOpen = false" />
    <TodayPracticeSheet :open="practiceSheetOpen" @close="practiceSheetOpen = false" />
  </view>
</template>

<style scoped lang="scss">
.library-page {
  background: var(--color-mint-page);
}

.library-page--detail {
  background: #f5f9fb;
}

.library-page:not(.library-page--detail)::before {
  position: absolute;
  top: 74px;
  left: -16px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 58px;
  line-height: 1;
  content: "✦";
}

.library-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 32px;
}

.library-actions__button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  height: 48px;
  overflow: hidden;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.2;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.94);
  border-radius: var(--radius-pill);
}

.library-actions__button--review {
  color: var(--color-aqua-strong);
}

.library-actions__button--add {
  color: var(--color-pink-strong);
}

.library-actions__icon {
  font-size: 23px;
  font-weight: 400;
  line-height: 1;
}

.artist-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 24px;
}
</style>
