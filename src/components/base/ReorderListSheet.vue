<script setup lang="ts">
import { ref, watch } from "vue";
import BottomSheet from "@/components/base/BottomSheet.vue";

export interface ReorderItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
}

const props = defineProps<{
  open: boolean;
  title: string;
  items: ReorderItem[];
}>();
const emit = defineEmits<{ close: []; save: [ids: string[]] }>();
const orderedIds = ref<string[]>([]);

watch(() => props.open, (open) => {
  if (open) orderedIds.value = props.items.map((item) => item.id);
}, { immediate: true });

const orderedItems = () => orderedIds.value
  .map((id) => props.items.find((item) => item.id === id))
  .filter((item): item is ReorderItem => Boolean(item));

const move = (index: number, direction: -1 | 1) => {
  const target = index + direction;
  if (target < 0 || target >= orderedIds.value.length) return;
  const next = [...orderedIds.value];
  [next[index], next[target]] = [next[target], next[index]];
  orderedIds.value = next;
};
</script>

<template>
  <BottomSheet :open="open" @close="$emit('close')">
    <view class="reorder-sheet">
      <view class="reorder-sheet__header">
        <view>
          <text class="reorder-sheet__title">{{ title }}</text>
          <text class="reorder-sheet__hint">使用箭头调整呈现顺序</text>
        </view>
        <button aria-label="关闭" @tap="$emit('close')"><text class="reorder-sheet__close-symbol">×</text></button>
      </view>

      <view class="reorder-sheet__list">
        <view v-for="(item, index) in orderedItems()" :key="item.id" class="reorder-row">
          <text class="reorder-row__index">{{ String(index + 1).padStart(2, "0") }}</text>
          <image v-if="item.imageUrl" class="reorder-row__image" :src="item.imageUrl" mode="aspectFill" />
          <view class="reorder-row__copy">
            <text>{{ item.title }}</text>
            <text v-if="item.subtitle">{{ item.subtitle }}</text>
          </view>
          <view class="reorder-row__actions">
            <button :disabled="index === 0" aria-label="向前移动" @tap="move(index, -1)"><text class="reorder-row__arrow">↑</text></button>
            <button :disabled="index === orderedIds.length - 1" aria-label="向后移动" @tap="move(index, 1)"><text class="reorder-row__arrow">↓</text></button>
          </view>
        </view>
      </view>

      <button class="reorder-sheet__save" @tap="emit('save', orderedIds)">保存顺序</button>
    </view>
  </BottomSheet>
</template>

<style scoped lang="scss">
.reorder-sheet { display: flex; flex-direction: column; gap: 18px; }
.reorder-sheet__header { display: flex; align-items: flex-start; justify-content: space-between; }
.reorder-sheet__header > view { display: flex; flex-direction: column; gap: 4px; }
.reorder-sheet__title { font-size: 24px; font-weight: 800; }
.reorder-sheet__hint { color: var(--color-muted); font-size: 12px; }
.reorder-sheet__header > button { display: flex !important; width: 36px; height: 36px; min-width: 36px; min-height: 36px; align-items: center; justify-content: center; padding: 0 !important; color: #fff; background: var(--glass-strong); border: 1px solid var(--color-line); }
.reorder-sheet__close-symbol { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 23px; line-height: 36px; text-align: center; }
.reorder-sheet__list { display: flex; max-height: 56dvh; flex-direction: column; gap: 8px; overflow-y: auto; }
.reorder-row { display: flex; min-height: 62px; align-items: center; gap: 10px; padding: 8px 10px; background: var(--glass); border: 1px solid var(--color-line); }
.reorder-row__index { width: 22px; color: var(--color-muted); font-size: 11px; }
.reorder-row__image { width: 44px; height: 44px; object-fit: cover; }
.reorder-row__copy { display: flex; flex: 1; flex-direction: column; gap: 3px; min-width: 0; }
.reorder-row__copy text:first-child { overflow: hidden; font-size: 14px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.reorder-row__copy text:last-child:not(:first-child) { color: var(--color-muted); font-size: 11px; }
.reorder-row__actions { display: flex; gap: 5px; }
.reorder-row__actions button { display: flex !important; width: 34px; height: 34px; min-width: 34px; min-height: 34px; align-items: center; justify-content: center; padding: 0 !important; color: #fff; background: var(--glass-strong); border: 1px solid var(--color-line); }
.reorder-row__arrow { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 18px; line-height: 34px; text-align: center; }
.reorder-row__actions button[disabled] { opacity: 0.25; }
.reorder-sheet__save { display: flex; height: 48px; align-items: center; justify-content: center; color: #fff; font-weight: 750; background: var(--glass-strong); border: 1px solid var(--color-line); }
</style>
