<script setup lang="ts">
import type { PracticeRecordView } from "@/domain/models/practice-record";

defineProps<{
  record: PracticeRecordView;
}>();

defineEmits<{
  select: [danceId: string];
}>();

const artistNameLines = (name: string) => name.trim().split(/\s+/).filter(Boolean);
</script>

<template>
  <button class="record-card" :aria-label="`${record.songTitle}，${record.actionLabel}`" @tap="$emit('select', record.danceId)">
    <view class="record-card__avatar" :class="`record-card__avatar--${record.artistTone}`">
      <view
        class="record-card__artist"
        :class="{ 'record-card__artist--long': record.artistName.length > 8 }"
      >
        <text v-for="line in artistNameLines(record.artistName)" :key="line" class="record-card__artist-line">
          {{ line }}
        </text>
      </view>
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
  background: #ffffff;
  border-radius: 16px;
}

.record-card__avatar {
  display: grid;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  margin-right: 14px;
  place-items: center;
  padding: 4px;
  font-size: 8px;
  font-weight: 700;
  border: 1px solid var(--color-line);
  border-radius: 50%;
}

.record-card__artist {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  line-height: 1.05;
  text-align: center;
}

.record-card__artist-line {
  display: block;
  max-width: 100%;
  white-space: nowrap;
}

.record-card__artist--long {
  font-size: 6.5px;
}

.record-card__avatar--pink {
  color: var(--color-pink-strong);
  background: radial-gradient(circle at 35% 35%, #ffffff, #ffedf6);
}

.record-card__avatar--blue {
  color: var(--color-aqua-strong);
  background: radial-gradient(circle at 35% 35%, #ffffff, #e8f7ff);
}

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

.record-card__dot--aqua {
  background: #35b9cf;
}

.record-card__dot--pink {
  background: var(--color-pink-strong);
}
</style>
