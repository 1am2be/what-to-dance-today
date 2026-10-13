<script setup lang="ts">
withDefaults(defineProps<{
  open: boolean;
  placement?: "bottom" | "center";
}>(), {
  placement: "bottom",
});
defineEmits<{ close: [] }>();
</script>

<template>
  <view
    v-if="open"
    class="sheet-layer"
    :class="{ 'sheet-layer--center': placement === 'center' }"
  >
    <button class="sheet-layer__backdrop" aria-label="关闭" @tap="$emit('close')" />
    <view class="sheet" :class="{ 'sheet--center': placement === 'center' }" @tap.stop>
      <view v-if="placement === 'bottom'" class="sheet__handle" />
      <slot />
    </view>
  </view>
</template>

<style scoped lang="scss">
.sheet-layer {
  position: fixed;
  z-index: 50;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet-layer__backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: rgba(4, 5, 8, 0.58);
  backdrop-filter: blur(5px);
}

.sheet-layer--center {
  align-items: center;
}

.sheet {
  position: relative;
  width: 100%;
  max-height: 92vh;
  max-height: 92dvh;
  padding: 14px 24px calc(28px + env(safe-area-inset-bottom));
  overflow-y: auto;
  color: #ffffff;
  background: rgba(22, 24, 29, 0.76);
  border-top: 1px solid var(--color-line);
  box-shadow: 0 -18px 42px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(26px);
}

.sheet__handle {
  width: 44px;
  height: 4px;
  margin: 0 auto 14px;
  background: rgba(255, 255, 255, 0.55);
}

.sheet.sheet--center {
  width: 100%;
  max-width: 422px;
  max-height: calc(100dvh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  padding: 28px 16px;
  overflow-y: auto;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}

@media (min-width: 768px) {
  .sheet {
    max-width: 390px;
    margin-bottom: 18px;
    border-radius: 0;
  }

  .sheet.sheet--center {
    margin-bottom: 0;
    border-radius: 0;
  }
}
</style>
