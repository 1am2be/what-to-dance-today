<script setup lang="ts">
import { ref, watch } from "vue";
import BottomSheet from "@/components/base/BottomSheet.vue";

const props = defineProps<{
  open: boolean;
  currentUrl: string;
  positionX: number;
  positionY: number;
}>();
const emit = defineEmits<{
  close: [];
  apply: [source: string, positionX: number, positionY: number];
  reset: [];
}>();

const source = ref("");
const positionX = ref(50);
const positionY = ref(50);
const saving = ref(false);

watch(() => props.open, (open) => {
  if (!open) return;
  source.value = props.currentUrl;
  positionX.value = props.positionX;
  positionY.value = props.positionY;
  saving.value = false;
});

const chooseBackground = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ["original"],
    sourceType: ["album", "camera"],
    success: (result) => {
      const paths = Array.isArray(result.tempFilePaths) ? result.tempFilePaths : [result.tempFilePaths];
      if (paths[0]) source.value = paths[0];
    },
  });
};

const sliderValue = (event: { detail: { value: number | string } }) => Number(event.detail.value);
const apply = () => {
  if (!source.value || saving.value) return;
  saving.value = true;
  emit("apply", source.value, positionX.value, positionY.value);
};
</script>

<template>
  <BottomSheet :open="open" @close="$emit('close')">
    <view class="background-editor">
      <view class="background-editor__header">
        <view>
          <text class="background-editor__title">修改背景</text>
          <text class="background-editor__hint">上传后调整画面主体的位置</text>
        </view>
        <button aria-label="关闭" @tap="$emit('close')">×</button>
      </view>

      <button class="background-editor__preview" @tap="chooseBackground">
        <image
          v-if="source"
          :src="source"
          mode="aspectFill"
          :style="{ objectPosition: `${positionX}% ${positionY}%` }"
        />
        <view class="background-editor__preview-veil" />
        <text>点击更换图片</text>
      </button>

      <view class="background-editor__control">
        <view><text>左右位置</text><text>{{ positionX }}%</text></view>
        <slider :value="positionX" :min="0" :max="100" active-color="#FFFFFF" background-color="rgba(255,255,255,.25)" block-color="#FFFFFF" :block-size="16" @changing="positionX = sliderValue($event)" />
      </view>
      <view class="background-editor__control">
        <view><text>上下位置</text><text>{{ positionY }}%</text></view>
        <slider :value="positionY" :min="0" :max="100" active-color="#FFFFFF" background-color="rgba(255,255,255,.25)" block-color="#FFFFFF" :block-size="16" @changing="positionY = sliderValue($event)" />
      </view>

      <view class="background-editor__actions">
        <button @tap="$emit('reset')">恢复初始背景</button>
        <button class="primary" :disabled="saving" @tap="apply">{{ saving ? "正在应用…" : "应用背景" }}</button>
      </view>
    </view>
  </BottomSheet>
</template>

<style scoped lang="scss">
.background-editor { display: flex; flex-direction: column; gap: 16px; }
.background-editor__header { display: flex; align-items: flex-start; justify-content: space-between; }
.background-editor__header > view { display: flex; flex-direction: column; gap: 4px; }
.background-editor__title { font-size: 24px; font-weight: 800; }
.background-editor__hint { color: var(--color-muted); font-size: 12px; }
.background-editor__header > button { display: grid; width: 36px; height: 36px; padding: 0 0 2px; color: #fff; font-size: 23px; line-height: 1; background: var(--glass-strong); border: 1px solid var(--color-line); place-items: center; }
.background-editor__preview { position: relative; width: min(62vw, 232px); height: min(116vw, 434px); max-height: 48dvh; align-self: center; overflow: hidden; background: var(--glass); border: 1px solid var(--color-line); }
.background-editor__preview image { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.background-editor__preview-veil { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.28); }
.background-editor__preview > text { position: absolute; right: 0; bottom: 0; left: 0; padding: 10px; color: #fff; font-size: 12px; text-align: center; background: rgba(0, 0, 0, 0.32); }
.background-editor__control { display: flex; flex-direction: column; gap: 2px; }
.background-editor__control > view { display: flex; justify-content: space-between; color: var(--color-muted); font-size: 12px; }
.background-editor__control slider { width: 100%; margin: 0; }
.background-editor__actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.background-editor__actions button { display: flex; height: 46px; align-items: center; justify-content: center; color: #fff; font-size: 13px; background: var(--glass); border: 1px solid var(--color-line); }
.background-editor__actions .primary { background: var(--glass-strong); font-weight: 750; }
.background-editor__actions button[disabled] { opacity: 0.45; }
</style>
