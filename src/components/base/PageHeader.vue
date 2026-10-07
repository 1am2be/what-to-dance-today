<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  accent?: "aqua" | "blue";
}>();
</script>

<template>
  <view class="page-header">
    <text class="page-header__eyebrow" :class="`page-header__eyebrow--${accent ?? 'aqua'}`">
      {{ eyebrow }}
    </text>
    <text class="page-header__title">{{ title }}</text>
    <text class="page-header__sparkle" aria-hidden="true">✦</text>
  </view>
</template>

<style scoped lang="scss">
.page-header {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.page-header__eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.page-header__eyebrow--aqua {
  color: var(--color-aqua-strong);
}

.page-header__eyebrow--blue {
  color: var(--color-blue);
}

.page-header__title {
  font-size: 36px;
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -1.5px;
}

.page-header__sparkle {
  position: absolute;
  top: -2px;
  right: 7px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 38px;
  line-height: 1;
}
</style>
