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
  background: rgba(28, 38, 48, 0.23);
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
  background: #ffffff;
  border-radius: 30px 30px 0 0;
  box-shadow: 0 -14px 36px rgba(36, 52, 65, 0.12);
}

.sheet__handle {
  width: 44px;
  height: 4px;
  margin: 0 auto 14px;
  background: var(--color-line);
  border-radius: 99px;
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
    border-radius: 30px;
  }

  .sheet.sheet--center {
    margin-bottom: 0;
    border-radius: 0;
  }
}
</style>
