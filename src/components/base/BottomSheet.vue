<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";

const props = withDefaults(defineProps<{
  open: boolean;
  placement?: "bottom" | "center";
}>(), {
  placement: "bottom",
});
defineEmits<{ close: [] }>();

let registeredOpen = false;

const updateDocumentState = (open: boolean) => {
  if (typeof document === "undefined" || open === registeredOpen) return;
  registeredOpen = open;
  const currentCount = Number(document.body.dataset.idolSheetCount || 0);
  const nextCount = Math.max(0, currentCount + (open ? 1 : -1));
  document.body.dataset.idolSheetCount = String(nextCount);
  document.body.classList.toggle("idol-sheet-open", nextCount > 0);
};

watch(() => props.open, updateDocumentState, { immediate: true });
onBeforeUnmount(() => updateDocumentState(false));
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
  z-index: var(--z-bottom-sheet);
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
  max-height: calc(100vh - env(safe-area-inset-top));
  max-height: calc(100dvh - env(safe-area-inset-top));
  padding: 14px 24px calc(28px + env(safe-area-inset-bottom));
  overflow-y: auto;
  overscroll-behavior: contain;
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
