<script setup lang="ts">
import { ref, watch } from "vue";
import BottomSheet from "@/components/base/BottomSheet.vue";

const props = defineProps<{ open: boolean; currentName: string }>();
const emit = defineEmits<{ close: []; save: [name: string] }>();
const name = ref("");

watch(() => props.open, (open) => {
  if (open) name.value = props.currentName;
});
</script>

<template>
  <BottomSheet :open="open" @close="$emit('close')">
    <view class="artist-name-sheet">
      <view class="artist-name-sheet__header">
        <text>编辑名称</text>
        <button aria-label="关闭" @tap="$emit('close')">×</button>
      </view>
      <text class="artist-name-sheet__label">Artist Name</text>
      <input v-model="name" maxlength="40" placeholder="输入 Artist 名称" />
      <button class="artist-name-sheet__save" @tap="emit('save', name)">保存名称</button>
    </view>
  </BottomSheet>
</template>

<style scoped lang="scss">
.artist-name-sheet { display: flex; flex-direction: column; gap: 12px; }
.artist-name-sheet__header { display: flex; align-items: center; justify-content: space-between; }
.artist-name-sheet__header > text { font-size: 24px; font-weight: 800; }
.artist-name-sheet__header button { display: grid; width: 36px; height: 36px; padding: 0 0 2px; color: #fff; font-size: 23px; line-height: 1; background: var(--glass-strong); border: 1px solid var(--color-line); place-items: center; }
.artist-name-sheet__label { color: var(--color-muted); font-size: 12px; }
.artist-name-sheet input { height: 50px; padding: 0 14px; color: #fff; font-size: 16px; background: var(--glass); border: 1px solid var(--color-line); }
.artist-name-sheet__save { display: flex; height: 48px; align-items: center; justify-content: center; color: #fff; font-weight: 750; background: var(--glass-strong); border: 1px solid var(--color-line); }
</style>
