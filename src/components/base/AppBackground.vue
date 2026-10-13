<script setup lang="ts">
defineProps<{
  src: string;
  positionX?: number;
  positionY?: number;
}>();
</script>

<template>
  <view class="app-background" aria-hidden="true">
    <image
      class="app-background__image"
      :src="src"
      mode="aspectFill"
      :style="{ objectPosition: `${positionX ?? 50}% ${positionY ?? 50}%` }"
    />
    <view class="app-background__veil" />
  </view>
</template>

<style scoped lang="scss">
.app-background {
  position: absolute;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.app-background__image {
  position: fixed;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-background__veil {
  position: fixed;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(3, 5, 8, 0.36), rgba(6, 8, 12, 0.52)),
    rgba(18, 20, 24, 0.12);
}

@media (min-width: 768px) and (hover: hover) and (pointer: fine) {
  .app-background__image,
  .app-background__veil {
    right: auto;
    left: 50%;
    width: 390px;
    margin-left: -195px;
  }
}
</style>
