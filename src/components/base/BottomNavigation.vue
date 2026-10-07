<script setup lang="ts">
type TabName = "library" | "history";

const props = defineProps<{
  active: TabName;
}>();

const navigate = (target: TabName) => {
  if (target === props.active) return;

  const url = target === "library" ? "/pages/library/index" : "/pages/practice-history/index";
  uni.redirectTo({ url });
};
</script>

<template>
  <view class="bottom-nav">
    <button
      class="bottom-nav__item"
      :class="{ 'bottom-nav__item--active-aqua': active === 'library' }"
      aria-label="我的舞单"
      @tap="navigate('library')"
    >
      <text class="bottom-nav__music" aria-hidden="true">♫</text>
      <text class="bottom-nav__label">我的舞单</text>
    </button>

    <button
      class="bottom-nav__item"
      :class="{ 'bottom-nav__item--active-pink': active === 'history' }"
      aria-label="练舞记录"
      @tap="navigate('history')"
    >
      <view class="bottom-nav__calendar" aria-hidden="true">
        <view class="bottom-nav__calendar-rings" />
      </view>
      <text class="bottom-nav__label">练舞记录</text>
    </button>
  </view>
</template>

<style scoped lang="scss">
.bottom-nav {
  position: fixed;
  z-index: 20;
  right: max(16px, calc((100vw - 390px) / 2 + 16px));
  bottom: calc(14px + env(safe-area-inset-bottom));
  left: max(16px, calc((100vw - 390px) / 2 + 16px));
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: var(--nav-height);
  padding: 8px;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid var(--color-line);
  border-radius: 22px;
}

.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  height: 100%;
  min-width: 0;
  color: var(--color-muted);
  line-height: 1.2;
  border-radius: 17px;
}

.bottom-nav__item--active-aqua,
.bottom-nav__item--active-pink {
  color: #ffffff;
}

.bottom-nav__item--active-aqua {
  background: var(--color-aqua);
}

.bottom-nav__item--active-pink {
  background: var(--color-pink);
}

.bottom-nav__music {
  height: 22px;
  font-size: 24px;
  font-weight: 700;
  line-height: 22px;
}

.bottom-nav__label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
}

.bottom-nav__calendar {
  position: relative;
  width: 18px;
  height: 17px;
  border: 2px solid currentColor;
  border-radius: 4px;
}

.bottom-nav__calendar::before {
  position: absolute;
  top: 3px;
  left: 0;
  width: 100%;
  border-top: 2px solid currentColor;
  content: "";
}

.bottom-nav__calendar-rings::before,
.bottom-nav__calendar-rings::after {
  position: absolute;
  top: -4px;
  width: 2px;
  height: 6px;
  background: currentColor;
  border-radius: 2px;
  content: "";
}

.bottom-nav__calendar-rings::before {
  left: 3px;
}

.bottom-nav__calendar-rings::after {
  right: 3px;
}
</style>
