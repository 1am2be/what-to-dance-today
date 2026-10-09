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
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  min-height: calc(var(--nav-height) + env(safe-area-inset-bottom));
  padding: 8px max(var(--page-gutter), env(safe-area-inset-right))
    calc(8px + env(safe-area-inset-bottom))
    max(var(--page-gutter), env(safe-area-inset-left));
  background: #ffffff;
  border-top: 1px solid var(--color-line);
  border-radius: 22px 22px 0 0;
  box-shadow: 0 -8px 24px rgba(56, 75, 92, 0.06);
}

.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  height: calc(var(--nav-height) - 16px);
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

@media (min-width: 768px) {
  .bottom-nav {
    right: auto;
    bottom: 18px;
    left: 50%;
    width: calc(390px - 32px);
    min-height: var(--nav-height);
    padding: 8px;
    border: 1px solid var(--color-line);
    border-radius: 22px;
    transform: translateX(-50%);
  }
}
</style>
