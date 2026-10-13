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
  padding: 5px 5px 0;
  overflow: hidden;
  text-align: left;
  line-height: 1.2;
  color: #ffffff;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.artist-card__art {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  isolation: isolate;
  border: 0;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.artist-card__art--aqua,
.artist-card__art--silver,
.artist-card__art--pearl,
.artist-card__art--mint { background: rgba(255, 255, 255, 0.08); }

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
  gap: 4px;
  min-height: 52px;
  padding: 9px 0 10px;
}

.artist-card__name {
  overflow: hidden;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist-card__count {
  color: var(--color-muted);
  font-size: 10px;
}
</style>
