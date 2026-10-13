<script setup lang="ts">
import { computed, ref } from "vue";
import ArtistNameSheet from "@/components/artist/ArtistNameSheet.vue";
import ImageCropSheet from "@/components/base/ImageCropSheet.vue";
import ReorderListSheet from "@/components/base/ReorderListSheet.vue";
import DanceListItem from "@/components/dance/DanceListItem.vue";
import type { ArtistSummary } from "@/domain/models/artist";
import { DanceValidationError, useAppStore } from "@/stores/app-v2";

const props = defineProps<{ artist: ArtistSummary; focusDanceId?: string }>();
const emit = defineEmits<{ back: []; deleted: [] }>();
const store = useAppStore();
const menuOpen = ref(false);
const cropOpen = ref(false);
const cropSource = ref("");
const nameSheetOpen = ref(false);
const reorderSheetOpen = ref(false);

const artistDances = computed(() => store.dances
  .filter((dance) => dance.artistId === props.artist.id)
  .sort((left, right) => left.sortOrder - right.sortOrder));
const practiceCount = computed(() => store.practiceRecords.filter((record) => record.artistId === props.artist.id).length);
const reorderItems = computed(() => artistDances.value.map((dance) => ({
  id: dance.id,
  title: dance.songTitle,
  subtitle: `${dance.scopeText} · ${store.practiceRecords.filter((record) => record.danceId === dance.id).length} 次练习`,
})));

const openNameEditor = () => {
  menuOpen.value = false;
  nameSheetOpen.value = true;
};

const openReorder = () => {
  menuOpen.value = false;
  reorderSheetOpen.value = true;
};

const saveArtistName = (name: string) => {
  try {
    store.renameArtist(props.artist.id, name);
    nameSheetOpen.value = false;
    uni.showToast({ title: "名称已更新", icon: "none" });
  } catch (error) {
    uni.showToast({
      title: error instanceof DanceValidationError && error.code === "artist-duplicate" ? "已有同名 Artist" : "请输入 Artist 名称",
      icon: "none",
    });
  }
};

const saveDanceOrder = (ids: string[]) => {
  store.reorderDances(props.artist.id, ids);
  reorderSheetOpen.value = false;
  uni.showToast({ title: "Song List 顺序已保存", icon: "none" });
};

const chooseArtistImage = () => {
  menuOpen.value = false;
  uni.chooseImage({
    count: 1,
    sizeType: ["original"],
    sourceType: ["album", "camera"],
    success: (result) => {
      const paths = Array.isArray(result.tempFilePaths) ? result.tempFilePaths : [result.tempFilePaths];
      const path = paths[0];
      if (!path) return;
      cropSource.value = path;
      cropOpen.value = true;
    },
  });
};

const replaceCropImage = () => {
  cropOpen.value = false;
  chooseArtistImage();
};

const applyCroppedImage = async (imageUrl: string) => {
  if (!await store.updateArtistImage(props.artist.id, imageUrl)) return;
  cropOpen.value = false;
  cropSource.value = "";
  uni.showToast({ title: "头像已更换", icon: "none" });
};

const confirmDeleteArtist = () => {
  menuOpen.value = false;
  uni.showModal({
    title: `删除 ${props.artist.name}？`,
    content: "删除了就找不回来了哦~",
    confirmText: "删除",
    confirmColor: "#EC6F9E",
    success: async ({ confirm }) => {
      if (!confirm) return;
      await store.deleteArtist(props.artist.id);
      emit("deleted");
      uni.showToast({ title: "Artist 已删除", icon: "none" });
    },
  });
};
</script>

<template>
  <view class="artist-detail">
    <view class="artist-detail__topbar">
      <button class="round-button" aria-label="返回" @tap="$emit('back')">‹</button>
      <view class="artist-actions">
        <button
          class="round-button round-button--more"
          aria-label="更多操作"
          :aria-expanded="menuOpen"
          @tap.stop="menuOpen = !menuOpen"
        >...</button>
        <view v-if="menuOpen" class="artist-actions__menu">
          <button class="artist-actions__item" @tap.stop="openNameEditor">编辑名称</button>
          <button class="artist-actions__item" @tap.stop="chooseArtistImage">更换头像</button>
          <button class="artist-actions__item" @tap.stop="openReorder">更换排序</button>
          <button class="artist-actions__item artist-actions__item--danger" @tap.stop="confirmDeleteArtist">删除专辑</button>
        </view>
      </view>
      <view v-if="menuOpen" class="artist-actions__backdrop" @tap="menuOpen = false" />
    </view>

    <view class="artist-hero">
      <view class="artist-hero__art" :class="`artist-hero__art--${artist.artworkTone}`">
        <image v-if="artist.imageUrl" :src="artist.imageUrl" mode="aspectFill" />
      </view>
      <view class="artist-hero__copy">
        <text class="artist-hero__name">{{ artist.name }}</text>
        <text class="artist-hero__meta">{{ artistDances.length }} 支舞 · {{ practiceCount }} 次练习</text>
      </view>
    </view>

    <view class="song-list">
      <text class="song-list__heading">SONG LIST</text>
      <view class="song-list__items">
        <DanceListItem
          v-for="(dance, index) in artistDances"
          :key="dance.id"
          :dance="dance"
          :index="index"
          :initially-expanded="dance.id === focusDanceId"
        />
        <view v-if="!artistDances.length" class="song-list__empty">
          <text>还没有舞蹈</text>
          <text>添加舞蹈后，它会出现在这里。</text>
        </view>
      </view>
    </view>

    <ImageCropSheet
      :open="cropOpen"
      :source="cropSource"
      @close="cropOpen = false"
      @replace="replaceCropImage"
      @confirm="applyCroppedImage"
    />
    <ArtistNameSheet
      :open="nameSheetOpen"
      :current-name="artist.name"
      @close="nameSheetOpen = false"
      @save="saveArtistName"
    />
    <ReorderListSheet
      :open="reorderSheetOpen"
      title="更换 Song List 顺序"
      :items="reorderItems"
      @close="reorderSheetOpen = false"
      @save="saveDanceOrder"
    />
  </view>
</template>

<style scoped lang="scss">
.artist-detail { position: relative; z-index: 2; padding: calc(24px + env(safe-area-inset-top)) var(--page-gutter) calc(110px + env(safe-area-inset-bottom)); color: #fff; }
.artist-detail__topbar { position: relative; z-index: 20; display: flex; align-items: center; justify-content: space-between; }
.round-button { display: flex; width: 42px; height: 42px; align-items: center; justify-content: center; margin: 0; padding: 0; color: #fff; font-size: 32px; font-weight: 300; line-height: 1; background: var(--glass); border: 1px solid var(--color-line); }
.round-button--more { padding: 0 0 4px; color: #fff; font-size: 18px; font-weight: 700; line-height: 1; letter-spacing: 2px; }
.artist-actions { position: relative; z-index: 2; }
.artist-actions__backdrop { position: fixed; z-index: 1; inset: 0; }
.artist-actions__menu { position: absolute; top: 49px; right: 0; display: flex; width: 142px; flex-direction: column; gap: 2px; padding: 5px; background: rgba(20, 22, 27, 0.78); border: 1px solid var(--color-line); box-shadow: 0 14px 34px rgba(0, 0, 0, 0.3); backdrop-filter: blur(18px); }
.artist-actions__item { display: flex; width: 100%; height: 39px; align-items: center; justify-content: center; padding: 0 10px; color: #fff; font-size: 13px; font-weight: 650; background: var(--glass); border: 1px solid transparent; }
.artist-actions__item--danger { color: rgba(255, 255, 255, 0.72); border-top-color: var(--color-line); }
.artist-hero { display: flex; min-height: 182px; align-items: center; gap: 14px; margin-top: 16px; padding: 20px 16px; overflow: hidden; color: #fff; background: var(--glass); border: 1px solid var(--color-line); backdrop-filter: blur(16px); }
.artist-hero__art { position: relative; flex: 0 0 118px; width: 118px; height: 118px; overflow: hidden; isolation: isolate; background: rgba(255, 255, 255, 0.09); border: 0; transform: translateZ(0); backface-visibility: hidden; }
.artist-hero__art image { position: absolute; inset: -1px; display: block; width: calc(100% + 2px); height: calc(100% + 2px); object-fit: cover; image-rendering: auto; transform: translateZ(0) scale(1.01); backface-visibility: hidden; }
.artist-hero__copy { display: flex; flex: 1; flex-direction: column; gap: 8px; min-width: 0; }
.artist-hero__name { overflow: hidden; font-size: 25px; font-weight: 800; line-height: 1.06; text-overflow: ellipsis; }
.artist-hero__meta { color: var(--color-muted); font-size: 12px; }
.song-list { margin-top: 22px; }
.song-list__heading { color: var(--color-muted); font-size: 11px; font-weight: 700; letter-spacing: 2px; }
.song-list__items { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.song-list__empty { display: flex; min-height: 150px; flex-direction: column; align-items: center; justify-content: center; gap: 5px; padding: 24px; color: var(--color-muted); font-size: 12px; text-align: center; background: var(--glass); border: 1px solid var(--color-line); }
.song-list__empty text:first-child { color: #fff; font-size: 15px; font-weight: 750; }
</style>
