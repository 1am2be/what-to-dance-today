<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  accent?: "aqua" | "blue";
}>();
</script>

<template>
  <view class="page-header">
    <view class="page-header__eyebrow-row">
      <text class="page-header__eyebrow" :class="`page-header__eyebrow--${accent ?? 'aqua'}`">
        {{ eyebrow }}
      </text>
      <slot name="eyebrow-action" />
    </view>
    <view class="page-header__title-row">
      <text class="page-header__title">{{ title }}</text>
      <slot name="title-action" />
    </view>
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
  color: rgba(255, 255, 255, 0.76);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.page-header__eyebrow-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.page-header__eyebrow--aqua,
.page-header__eyebrow--blue { color: rgba(255, 255, 255, 0.76); }

.page-header__title-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.page-header__title {
  color: #ffffff;
  font-size: 32px;
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: 2px;
}

</style>
