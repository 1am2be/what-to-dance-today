<script setup lang="ts">
import type { PracticeRecordView } from "@/domain/models/practice-record";

defineProps<{
  record: PracticeRecordView;
}>();

defineEmits<{
  select: [danceId: string];
}>();

</script>

<template>
  <button class="record-card" :aria-label="`${record.songTitle}，${record.actionLabel}`" @tap="$emit('select', record.danceId)">
    <view class="record-card__avatar" :class="`record-card__avatar--${record.artistTone}`">
      <image v-if="record.artistImageUrl" :src="record.artistImageUrl" mode="aspectFill" />
      <text v-else class="record-card__fallback">{{ record.artistName.slice(0, 2) }}</text>
    </view>

    <view class="record-card__content">
      <text class="record-card__title">{{ record.songTitle }}</text>
      <text class="record-card__meta">{{ record.scopeText }} · {{ record.actionLabel }}</text>
    </view>

    <view class="record-card__dot" :class="`record-card__dot--${record.actionLabel === '复习' ? 'pink' : 'aqua'}`" />
  </button>
</template>

<style scoped lang="scss">
.record-card {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 76px;
  padding: 16px 26px;
  text-align: left;
  line-height: 1.2;
  color: #ffffff;
  background: var(--glass);
  border: 1px solid var(--color-line);
  backdrop-filter: blur(12px);
}

.record-card__avatar {
  display: grid;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  margin-right: 14px;
  place-items: center;
  padding: 0;
  overflow: hidden;
  font-size: 8px;
  font-weight: 700;
  border: 0;
  border-radius: 0;
}

.record-card__avatar image { display: block; width: 100%; height: 100%; object-fit: cover; transform: translateZ(0) scale(1.01); }
.record-card__fallback { padding: 3px; font-size: 8px; font-weight: 700; text-align: center; }

.record-card__avatar--pink,
.record-card__avatar--blue { color: #ffffff; background: rgba(255, 255, 255, 0.08); }

.record-card__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.record-card__title {
  overflow: hidden;
  font-size: 17px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-card__meta {
  overflow: hidden;
  color: var(--color-muted);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-card__dot {
  flex: 0 0 10px;
  width: 10px;
  height: 10px;
  margin-left: 12px;
  border-radius: 50%;
}

.record-card__dot--aqua { background: rgba(255, 255, 255, 0.92); }
.record-card__dot--pink { background: rgba(255, 255, 255, 0.55); }
</style>
