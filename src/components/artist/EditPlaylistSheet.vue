<script setup lang="ts">
import { ref } from "vue";
import BottomSheet from "@/components/base/BottomSheet.vue";

defineProps<{ open: boolean }>();
const emit = defineEmits<{
  close: [];
  background: [];
  reorder: [];
  export: [];
  restore: [file: File];
}>();

const restoreInput = ref<HTMLInputElement | null>(null);

const chooseRestoreFile = () => restoreInput.value?.click();

const selectRestoreFile = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) emit("restore", file);
  input.value = "";
};
</script>

<template>
  <BottomSheet :open="open" @close="$emit('close')">
    <view class="edit-playlist">
      <view class="edit-playlist__header">
        <view>
          <text class="edit-playlist__title">编辑舞单</text>
          <text class="edit-playlist__hint">调整舞单的视觉与呈现顺序</text>
        </view>
        <button aria-label="关闭" @tap="$emit('close')"><text class="edit-playlist__close-symbol">×</text></button>
      </view>
      <button class="edit-playlist__choice" @tap="$emit('background')">
        <view class="edit-playlist__icon"><text>▧</text></view>
        <view class="edit-playlist__copy"><text>修改背景</text><text>上传自己的图片并调整画面位置</text></view>
        <view class="edit-playlist__chevron"><text>›</text></view>
      </button>
      <button class="edit-playlist__choice" @tap="$emit('reorder')">
        <view class="edit-playlist__icon"><text>↕</text></view>
        <view class="edit-playlist__copy"><text>更换顺序</text><text>调整 Artist 专辑在舞单中的位置</text></view>
        <view class="edit-playlist__chevron"><text>›</text></view>
      </button>

      <text class="edit-playlist__section-title">数据管理</text>
      <button class="edit-playlist__choice" @tap="$emit('export')">
        <view class="edit-playlist__icon"><text>⇩</text></view>
        <view class="edit-playlist__copy"><text>导出备份</text><text>保存舞单、记录、图片和音乐</text></view>
        <view class="edit-playlist__chevron"><text>›</text></view>
      </button>
      <button class="edit-playlist__choice" @tap="chooseRestoreFile">
        <view class="edit-playlist__icon"><text>⇧</text></view>
        <view class="edit-playlist__copy"><text>恢复备份</text><text>从备份文件恢复本机数据</text></view>
        <view class="edit-playlist__chevron"><text>›</text></view>
      </button>
      <input
        ref="restoreInput"
        class="edit-playlist__file-input"
        type="file"
        accept=".idoldance,application/x-idol-dance-backup"
        @change="selectRestoreFile"
      />
    </view>
  </BottomSheet>
</template>

<style scoped lang="scss">
.edit-playlist { display: flex; flex-direction: column; gap: 10px; }
.edit-playlist__header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
.edit-playlist__header > view { display: flex; flex-direction: column; gap: 4px; }
.edit-playlist__title { font-size: 24px; font-weight: 800; }
.edit-playlist__hint { color: var(--color-muted); font-size: 12px; }
.edit-playlist__header > button { display: flex !important; width: 36px; height: 36px; min-width: 36px; min-height: 36px; align-items: center; justify-content: center; padding: 0 !important; color: #fff; background: var(--glass-strong); border: 1px solid var(--color-line); }
.edit-playlist__close-symbol { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 23px; line-height: 36px; text-align: center; }
.edit-playlist__choice { display: flex; width: 100%; min-height: 74px; align-items: center; gap: 12px; padding: 12px; color: #fff; text-align: left; background: var(--glass); border: 1px solid var(--color-line); }
.edit-playlist__icon { display: flex; width: 38px; height: 38px; flex: 0 0 38px; align-items: center; justify-content: center; background: var(--glass-strong); border: 1px solid var(--color-line); }
.edit-playlist__icon text { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 19px; line-height: 38px; text-align: center; }
.edit-playlist__copy { display: flex; flex: 1; flex-direction: column; gap: 4px; min-width: 0; }
.edit-playlist__copy text:first-child { font-size: 15px; font-weight: 750; }
.edit-playlist__copy text:last-child { color: var(--color-muted); font-size: 11px; }
.edit-playlist__chevron { display: flex; width: 28px; height: 38px; flex: 0 0 28px; align-items: center; justify-content: center; color: var(--color-muted); }
.edit-playlist__chevron text { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 24px; line-height: 38px; text-align: center; }
.edit-playlist__section-title { margin: 10px 0 2px; color: var(--color-muted); font-size: 10px; font-weight: 750; letter-spacing: 1.5px; }
.edit-playlist__file-input { position: fixed; top: -10000px; left: -10000px; width: 1px; height: 1px; opacity: 0; }
</style>
