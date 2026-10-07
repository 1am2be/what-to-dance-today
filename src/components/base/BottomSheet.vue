<script setup lang="ts">
defineProps<{ open: boolean }>();
defineEmits<{ close: [] }>();
</script>

<template>
  <view v-if="open" class="sheet-layer">
    <button class="sheet-layer__backdrop" aria-label="关闭" @tap="$emit('close')" />
    <view class="sheet" @tap.stop>
      <view class="sheet__handle" />
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

.sheet {
  position: relative;
  width: 100%;
  max-width: 390px;
  max-height: 92vh;
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

@media (min-width: 430px) {
  .sheet {
    margin-bottom: 18px;
    border-radius: 30px;
  }
}
</style>
