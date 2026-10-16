<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import ArtistCard from "@/components/artist/ArtistCard.vue";
import BackgroundEditorSheet from "@/components/artist/BackgroundEditorSheet.vue";
import EditPlaylistSheet from "@/components/artist/EditPlaylistSheet.vue";
import ArtistDetailView from "@/components/artist/ArtistDetailView.vue";
import AppBackground from "@/components/base/AppBackground.vue";
import BottomNavigation from "@/components/base/BottomNavigation.vue";
import PageHeader from "@/components/base/PageHeader.vue";
import ReorderListSheet from "@/components/base/ReorderListSheet.vue";
import AddDanceSheet from "@/components/dance/AddDanceSheet.vue";
import TodayPracticeSheet from "@/components/dance/TodayPracticeSheet.vue";
import UsageGuideSheet from "@/components/dance/UsageGuideSheetV2.vue";
import type { ArtistSummary } from "@/domain/models/artist";
import { useAppStore } from "@/stores/app-v2";

const store = useAppStore();
const addSheetOpen = ref(false);
const practiceSheetOpen = ref(false);
const usageGuideOpen = ref(false);
const editPlaylistOpen = ref(false);
const backgroundEditorOpen = ref(false);
const reorderOpen = ref(false);
const selectedArtistId = ref("");
const focusDanceId = ref("");
const currentPage = ref(0);
let pageSwipeStart = { x: 0, y: 0 };
const totalDances = computed(() => store.dances.length);
const selectedArtist = computed(() => store.artistSummaries.find((artist) => artist.id === selectedArtistId.value));
const pageCount = computed(() => Math.max(1, Math.ceil(store.artistSummaries.length / 9)));
const visibleArtists = computed(() => store.artistSummaries.slice(currentPage.value * 9, currentPage.value * 9 + 9));
const reorderItems = computed(() => store.artistSummaries.map((artist) => ({
  id: artist.id,
  title: artist.name,
  subtitle: `${artist.danceCount} 支舞`,
  imageUrl: artist.imageUrl,
})));

onMounted(() => { void store.initialize(); });
onLoad((query) => {
  void store.initialize();
  if (query?.artistId) selectedArtistId.value = String(query.artistId);
  if (query?.danceId) focusDanceId.value = String(query.danceId);
});

watch(pageCount, (count) => {
  if (currentPage.value >= count) currentPage.value = count - 1;
});

const beginPageSwipe = (event: TouchEvent) => {
  const touch = event.touches?.[0];
  if (!touch) return;
  pageSwipeStart = { x: touch.clientX, y: touch.clientY };
};

const finishPageSwipe = (event: TouchEvent) => {
  const touch = event.changedTouches?.[0];
  if (!touch) return;
  const deltaX = touch.clientX - pageSwipeStart.x;
  const deltaY = touch.clientY - pageSwipeStart.y;
  if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return;
  if (deltaX < 0 && currentPage.value < pageCount.value - 1) currentPage.value += 1;
  if (deltaX > 0 && currentPage.value > 0) currentPage.value -= 1;
};

const openArtist = (artist: ArtistSummary) => {
  selectedArtistId.value = artist.id;
  focusDanceId.value = "";
};

const openBackgroundEditor = () => {
  editPlaylistOpen.value = false;
  backgroundEditorOpen.value = true;
};

const openReorder = () => {
  editPlaylistOpen.value = false;
  reorderOpen.value = true;
};

const openAddFromPractice = () => {
  practiceSheetOpen.value = false;
  addSheetOpen.value = true;
};

const applyBackground = async (source: string, positionX: number, positionY: number) => {
  try {
    await store.updateBackground(source, positionX, positionY);
    backgroundEditorOpen.value = false;
    uni.showToast({ title: "背景已更新", icon: "none" });
  } catch {
    uni.showToast({ title: "背景保存失败，请换一张图片", icon: "none" });
  }
};

const resetBackground = async () => {
  await store.resetBackground();
  backgroundEditorOpen.value = false;
  uni.showToast({ title: "已恢复初始背景", icon: "none" });
};

const saveArtistOrder = (ids: string[]) => {
  store.reorderArtists(ids);
  reorderOpen.value = false;
  currentPage.value = 0;
  uni.showToast({ title: "舞单顺序已保存", icon: "none" });
};

const exportBackup = async () => {
  try {
    const { blob, filename } = await store.exportBackup();
    if (typeof document === "undefined") {
      uni.showToast({ title: "请在网页版本中导出备份", icon: "none" });
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    editPlaylistOpen.value = false;
    uni.showToast({ title: "备份文件已导出", icon: "none" });
  } catch {
    uni.showToast({ title: "备份导出失败，请再试一次", icon: "none" });
  }
};

const restoreBackup = (file: File) => {
  uni.showModal({
    title: "恢复备份",
    content: "恢复后会替换本机现有的舞单、练舞记录、图片和音乐。是否继续？",
    confirmText: "继续恢复",
    cancelText: "取消",
    success: async ({ confirm }) => {
      if (!confirm) return;
      try {
        await store.restoreBackup(file);
        editPlaylistOpen.value = false;
        selectedArtistId.value = "";
        focusDanceId.value = "";
        currentPage.value = 0;
        uni.showToast({ title: "备份已恢复", icon: "none" });
      } catch {
        uni.showToast({ title: "备份文件无效或已损坏", icon: "none" });
      }
    },
  });
};
</script>

<template>
  <view class="mobile-page library-page" :class="{ 'library-page--detail': selectedArtist }">
    <AppBackground
      :src="store.backgroundUrl"
      :position-x="store.settings.backgroundPositionX"
      :position-y="store.settings.backgroundPositionY"
    />
    <ArtistDetailView
      v-if="selectedArtist"
      :artist="selectedArtist"
      :focus-dance-id="focusDanceId"
      @back="selectedArtistId = ''"
      @deleted="selectedArtistId = ''; focusDanceId = ''"
    />

    <view v-else class="page-content">
      <PageHeader :eyebrow="`IDOL DANCE · ${totalDances} DANCE`" title="我的舞单">
        <template #title-action>
          <view class="title-actions">
            <button @tap="usageGuideOpen = true">使用说明</button>
            <button @tap="editPlaylistOpen = true">编辑舞单</button>
          </view>
        </template>
      </PageHeader>

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

      <view v-if="!store.artistSummaries.length" class="library-empty">
        <text class="library-empty__title">舞单还是空的</text>
        <text class="library-empty__copy">先记录一支学过的舞吧。</text>
        <button @tap="addSheetOpen = true">＋ 添加第一支舞</button>
      </view>

      <view
        v-else
        class="artist-pager"
        :class="{ 'artist-pager--paged': pageCount > 1 }"
        @touchstart="beginPageSwipe"
        @touchend="finishPageSwipe"
      >
        <view class="artist-grid">
          <ArtistCard
            v-for="artist in visibleArtists"
            :key="artist.id"
            :artist="artist"
            @select="openArtist"
          />
        </view>
      </view>

      <view v-if="pageCount > 1" class="page-switcher">
        <button
          v-for="page in pageCount"
          :key="page"
          :class="{ active: currentPage === page - 1 }"
          :aria-label="`第 ${page} 页`"
          @tap="currentPage = page - 1"
        />
      </view>
    </view>

    <BottomNavigation active="library" />
    <AddDanceSheet v-if="addSheetOpen" :open="addSheetOpen" @close="addSheetOpen = false" />
    <TodayPracticeSheet :open="practiceSheetOpen" @close="practiceSheetOpen = false" @add="openAddFromPractice" />
    <UsageGuideSheet :open="usageGuideOpen" @close="usageGuideOpen = false" />
    <EditPlaylistSheet
      :open="editPlaylistOpen"
      @close="editPlaylistOpen = false"
      @background="openBackgroundEditor"
      @reorder="openReorder"
      @export="exportBackup"
      @restore="restoreBackup"
    />
    <BackgroundEditorSheet
      :open="backgroundEditorOpen"
      :current-url="store.backgroundUrl"
      :position-x="store.settings.backgroundPositionX"
      :position-y="store.settings.backgroundPositionY"
      @close="backgroundEditorOpen = false"
      @apply="applyBackground"
      @reset="resetBackground"
    />
    <ReorderListSheet
      :open="reorderOpen"
      title="更换 Artist 顺序"
      :items="reorderItems"
      @close="reorderOpen = false"
      @save="saveArtistOrder"
    />
  </view>
</template>

<style scoped lang="scss">
.library-page { background: #111318; }
.page-content { position: relative; z-index: 2; }
.title-actions { display: flex; align-items: baseline; gap: 4px; margin-left: -2px; }
.title-actions button { display: inline-flex; height: 22px; align-items: center; justify-content: center; padding: 0 1px; color: #fff; font-size: 11px; font-weight: 700; line-height: 1; background: transparent; }
.title-actions button:last-child { color: rgba(255, 255, 255, 0.72); }

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
  color: #ffffff;
  background: var(--glass);
  border: 1px solid var(--color-line);
  backdrop-filter: blur(14px);
}

.library-actions__button--review,
.library-actions__button--add { color: #ffffff; }

.library-actions__icon {
  font-size: 23px;
  font-weight: 400;
  line-height: 1;
}

.artist-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;
  margin-top: 24px;
}

.artist-pager--paged {
  min-height: calc(min(100vw, 390px) - var(--page-gutter) - var(--page-gutter) + 156px);
  touch-action: pan-y;
}

.library-empty { display: flex; min-height: 260px; flex-direction: column; align-items: center; justify-content: center; gap: 7px; margin-top: 24px; padding: 30px 20px; text-align: center; background: var(--glass); border: 1px solid var(--color-line); backdrop-filter: blur(14px); }
.library-empty__title { color: #fff; font-size: 20px; font-weight: 800; letter-spacing: 1px; }
.library-empty__copy { color: var(--color-muted); font-size: 12px; }
.library-empty button { display: flex; height: 42px; align-items: center; justify-content: center; margin-top: 13px !important; padding: 0 18px; color: #fff; font-size: 13px; font-weight: 700; background: var(--glass-strong); border: 1px solid var(--color-line); }

.page-switcher {
  position: fixed;
  z-index: calc(var(--z-bottom-nav) - 1);
  bottom: calc(var(--nav-height) + env(safe-area-inset-bottom) + 16px);
  left: 50%;
  display: flex;
  min-height: 18px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  transform: translateX(-50%);
}
.page-switcher > button {
  display: block;
  width: 8px;
  height: 8px;
  min-width: 8px;
  min-height: 8px;
  max-width: 8px;
  max-height: 8px;
  flex: 0 0 8px;
  padding: 0;
  background: rgba(255, 255, 255, 0.34);
  border: 0;
  border-radius: 50%;
  aspect-ratio: 1 / 1;
}
.page-switcher > button.active { background: #fff; transform: scale(1.35); }

@media (min-width: 768px) {
  .page-switcher { bottom: calc(18px + var(--nav-height) + 16px); }
}
</style>
