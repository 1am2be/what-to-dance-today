<script setup lang="ts">
import type { ArtistSummary } from "@/domain/models/artist";

defineProps<{
  artist: ArtistSummary;
}>();

defineEmits<{
  select: [artist: ArtistSummary];
}>();
</script>

<template>
  <button class="artist-card" @tap="$emit('select', artist)">
    <view class="artist-card__art" :class="`artist-card__art--${artist.artworkTone}`">
      <image
        v-if="artist.imageUrl"
        class="artist-card__image"
        :src="artist.imageUrl"
        mode="aspectFill"
      />
    </view>
    <view class="artist-card__body">
      <text class="artist-card__name">{{ artist.name }}</text>
      <text class="artist-card__count">{{ artist.danceCount }} 支舞</text>
    </view>
  </button>
</template>

<style scoped lang="scss">
.artist-card {
  width: 100%;
  padding: 8px 8px 0;
  overflow: hidden;
  text-align: left;
  line-height: 1.2;
  background: var(--color-white);
  border-radius: var(--radius-card);
  box-shadow: 0 10px 24px rgba(96, 153, 160, 0.07);
}

.artist-card__art {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  isolation: isolate;
  border-radius: 14px 14px 4px 4px;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.artist-card__art--aqua {
  background: radial-gradient(circle at 72% 68%, #edf7ff 0, #c9f7fa 46%, #e9fbff 100%);
}

.artist-card__art--silver {
  background: radial-gradient(circle at 68% 45%, #f2f5f8 0, #cdd6e2 58%, #eaf0f5 100%);
}

.artist-card__art--pearl {
  background: linear-gradient(132deg, #ffe8f4 0%, #f5f7ff 43%, #e6fbff 100%);
}

.artist-card__art--mint {
  background: radial-gradient(circle at 30% 78%, #9ee8d9 0, #cdf8ef 48%, #e6fbf8 100%);
}

.artist-card__image {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: auto;
  transform: translateZ(0) scale(1.01);
  backface-visibility: hidden;
}

.artist-card__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 68px;
  padding: 13px 0 16px;
}

.artist-card__name {
  overflow: hidden;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist-card__count {
  color: var(--color-muted);
  font-size: 13px;
}
</style>
