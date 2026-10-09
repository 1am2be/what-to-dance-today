<script setup lang="ts">
import { computed, ref } from "vue";
import ImageCropSheet from "@/components/base/ImageCropSheet.vue";
import DanceListItem from "@/components/dance/DanceListItem.vue";
import type { ArtistSummary } from "@/domain/models/artist";
import { useAppStore } from "@/stores/app";

const props = defineProps<{ artist: ArtistSummary; focusDanceId?: string }>();
const emit = defineEmits<{ back: []; deleted: [] }>();
const store = useAppStore();
const menuOpen = ref(false);
const cropOpen = ref(false);
const cropSource = ref("");

const artistDances = computed(() => store.dances.filter((dance) => dance.artistId === props.artist.id));
const practiceCount = computed(() => store.practiceRecords.filter((record) => record.artistId === props.artist.id).length);

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

const applyCroppedImage = (imageUrl: string) => {
  if (!store.updateArtistImage(props.artist.id, imageUrl)) return;
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
    success: ({ confirm }) => {
      if (!confirm) return;
      store.deleteArtist(props.artist.id);
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
          <button class="artist-actions__item" @tap.stop="chooseArtistImage">更换头像</button>
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
      <text class="artist-hero__star artist-hero__star--large">✦</text>
      <text class="artist-hero__star artist-hero__star--small">✦</text>
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
      </view>
    </view>

    <ImageCropSheet
      :open="cropOpen"
      :source="cropSource"
      @close="cropOpen = false"
      @replace="replaceCropImage"
      @confirm="applyCroppedImage"
    />
  </view>
</template>

<style scoped lang="scss">
.artist-detail { padding: calc(24px + env(safe-area-inset-top)) var(--page-gutter) calc(110px + env(safe-area-inset-bottom)); }
.artist-detail__topbar { position: relative; z-index: 20; display: flex; align-items: center; justify-content: space-between; margin-right: -8px; margin-left: -8px; }
.round-button { display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; margin: 0; padding: 0; font-size: 34px; font-weight: 300; line-height: 1; background: #fff; border: 0; border-radius: 50%; }
.round-button::after { border: 0; }
.round-button--more { padding-bottom: 8px; color: var(--color-muted); font-size: 18px; font-weight: 700; letter-spacing: 2px; }
.artist-actions { position: relative; z-index: 2; }
.artist-actions__backdrop { position: fixed; z-index: 1; inset: 0; }
.artist-actions__menu { position: absolute; top: 50px; right: 0; display: flex; width: 132px; flex-direction: column; gap: 3px; padding: 6px; background: rgba(255, 255, 255, 0.98); border: 1px solid rgba(204, 214, 224, 0.92); border-radius: 16px; box-shadow: 0 12px 30px rgba(75, 94, 112, 0.18); }
.artist-actions__item { display: flex; align-items: center; justify-content: center; width: 100%; height: 40px; margin: 0; padding: 0 12px; color: var(--color-ink); font-size: 14px; font-weight: 650; line-height: 1; background: #f5fbfc; border: 0; border-radius: 11px; }
.artist-actions__item::after { border: 0; }
.artist-actions__item--danger { color: var(--color-pink-strong); background: #fff1f7; }
.artist-hero { position: relative; display: flex; align-items: center; gap: 14px; min-height: 190px; margin-top: 16px; padding: 22px 18px; overflow: hidden; color: #fff; background: #f58bc3; border-radius: 24px; }
.artist-hero__art { position: relative; flex: 0 0 122px; width: 122px; height: 122px; overflow: hidden; isolation: isolate; border: 1px solid rgba(255, 255, 255, 0.28); border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12); transform: translateZ(0); backface-visibility: hidden; }
.artist-hero__art--aqua { background: radial-gradient(circle at 70% 70%, #ecfaff 0, #afe6f3 48%, #f4e6f5 100%); }
.artist-hero__art--silver { background: radial-gradient(circle at 65% 45%, #f7f9fb 0, #c7d1df 60%, #eff4f8 100%); }
.artist-hero__art--pearl { background: linear-gradient(135deg, #ffe8f4, #dff8ff); }
.artist-hero__art--mint { background: radial-gradient(circle at 35% 70%, #98e8d6, #d8f9f2 65%, #efffff); }
.artist-hero__art image { position: absolute; inset: -1px; display: block; width: calc(100% + 2px); height: calc(100% + 2px); image-rendering: auto; transform: translateZ(0) scale(1.01); backface-visibility: hidden; }
.artist-hero__copy { position: relative; z-index: 2; display: flex; flex: 1; flex-direction: column; gap: 8px; min-width: 0; }
.artist-hero__name { overflow: hidden; font-size: 26px; font-weight: 800; line-height: 1.05; text-overflow: ellipsis; }
.artist-hero__meta { font-size: 13px; }
.artist-hero__star { position: absolute; color: rgba(255, 255, 255, 0.88); line-height: 1; }
.artist-hero__star--large { top: 16px; right: 13px; font-size: 34px; }
.artist-hero__star--small { right: 31px; bottom: 30px; color: #7ed9e7; font-size: 24px; }
.song-list { margin-top: 22px; }
.song-list__heading { color: var(--color-muted); font-size: 12px; font-weight: 650; letter-spacing: 2px; }
.song-list__items { display: flex; flex-direction: column; gap: 8px; margin-top: 13px; }
</style>
