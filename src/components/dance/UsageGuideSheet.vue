<script setup lang="ts">
import BottomSheet from "@/components/base/BottomSheet.vue";

defineProps<{ open: boolean }>();
defineEmits<{ close: [] }>();
</script>

<template>
  <BottomSheet :open="open" placement="center" @close="$emit('close')">
    <view class="usage-guide">
      <view class="usage-guide__frame">
        <view class="usage-guide__charm" aria-hidden="true">
          <view class="usage-guide__charm-line" />
          <text class="usage-guide__charm-heart">♥</text>
          <text class="usage-guide__charm-spark">✦</text>
        </view>

        <button class="usage-guide__close" aria-label="关闭使用说明" @tap="$emit('close')">
          <text>×</text>
        </button>

        <view class="usage-guide__paper">
          <view class="usage-guide__intro">
            <text class="usage-guide__title">Idol Dance</text>
            <text class="usage-guide__paragraph">记录你为喜欢的 Idol 学过的每一支舞。</text>
          </view>

          <view class="usage-guide__section">
            <text class="usage-guide__heading">怎么用</text>
            <view class="usage-guide__bullet">
              <text class="usage-guide__bullet-mark">✦</text>
              <text>学新舞时记录一次，系统会按 <text class="usage-guide__emphasis">1 / 3 / 7 / 14 天</text>提醒你复习；完成 4 次复习，就会进入“已掌握”。</text>
            </view>
            <view class="usage-guide__bullet">
              <text class="usage-guide__bullet-mark">✦</text>
              <text>以前已经会的舞，也可以直接加入舞单。</text>
            </view>
          </view>

          <view class="usage-guide__section">
            <text class="usage-guide__heading">练什么</text>
            <view class="usage-guide__bullet">
              <text class="usage-guide__bullet-mark">✦</text>
              <text>“今天练什么”会优先推荐复习快忘掉的舞蹈，也会随机推荐 3 支已掌握的舞蹈。</text>
            </view>
            <view class="usage-guide__bullet">
              <text class="usage-guide__bullet-mark">✦</text>
              <text>适合大家平时复习，和参加随机舞蹈的热身！</text>
            </view>
          </view>

          <text class="usage-guide__ending">一起开心跳舞吧~</text>
        </view>
      </view>
    </view>
  </BottomSheet>
</template>

<style scoped lang="scss">
.usage-guide {
  position: relative;
  padding: 2px 0 4px;
}

.usage-guide__frame {
  position: relative;
  padding: 10px;
  background: linear-gradient(145deg, #ffe9f3 0%, #f7cfe1 52%, #f3bfd7 100%);
  border: 1px solid #efb6d0;
  border-radius: 8px;
  box-shadow:
    0 10px 20px rgba(171, 86, 124, 0.18),
    inset 0 2px 0 rgba(255, 255, 255, 0.9),
    inset 0 -2px 3px rgba(179, 94, 132, 0.13);
}

.usage-guide__paper {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 500px;
  padding: 52px 22px 24px;
  background: #ffffff;
  border: 1px solid rgba(215, 200, 207, 0.8);
  border-radius: 2px;
  box-shadow:
    inset 0 2px 7px rgba(75, 67, 72, 0.08),
    0 1px 2px rgba(255, 255, 255, 0.9);
}

.usage-guide__close {
  position: absolute;
  z-index: 3;
  top: -12px;
  right: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: #ffffff;
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
  background: radial-gradient(circle at 34% 26%, #ff9fc5 0%, #e85b92 43%, #c83872 100%);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  outline: 1px solid rgba(172, 60, 105, 0.42);
  outline-offset: 3px;
  box-shadow:
    0 7px 14px rgba(157, 54, 96, 0.26),
    inset 2px 3px 4px rgba(255, 255, 255, 0.48),
    inset -3px -4px 6px rgba(126, 32, 70, 0.18);
}

.usage-guide__close text {
  line-height: 1;
  transform: translateY(-1px);
}

.usage-guide__close:active {
  box-shadow:
    0 3px 8px rgba(157, 54, 96, 0.22),
    inset 0 2px 3px rgba(255, 255, 255, 0.38);
  transform: translateY(2px) scale(0.97);
}

.usage-guide__charm {
  position: absolute;
  z-index: 2;
  top: -25px;
  left: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.usage-guide__charm-line {
  width: 1px;
  height: 47px;
  background: linear-gradient(#444b53 0%, #f7fbff 34%, #727c87 68%, #e9eff4 100%);
  box-shadow: 1px 0 0 rgba(255, 255, 255, 0.8);
}

.usage-guide__charm-heart {
  margin-top: -7px;
  color: transparent;
  font-size: 54px;
  line-height: 1;
  background: linear-gradient(125deg, #363d45 5%, #f8fcff 24%, #87929d 42%, #ffffff 57%, #515a64 76%, #dfe8ef 94%);
  background-clip: text;
  filter: drop-shadow(3px 5px 3px rgba(42, 51, 59, 0.32));
  -webkit-background-clip: text;
  -webkit-text-stroke: 1px rgba(56, 65, 74, 0.72);
  transform: rotate(-11deg) scaleX(0.88);
}

.usage-guide__charm-spark {
  position: absolute;
  right: -7px;
  bottom: 7px;
  color: #ffffff;
  font-size: 15px;
  line-height: 1;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.92);
}

.usage-guide__intro,
.usage-guide__section {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.usage-guide__title {
  color: var(--color-pink-strong);
  font-size: 24px;
  font-weight: 850;
  letter-spacing: -0.4px;
}

.usage-guide__heading {
  width: fit-content;
  padding: 4px 10px;
  color: #128da1;
  font-size: 14px;
  font-weight: 750;
  background: #daf8f3;
  border-radius: 999px;
}

.usage-guide__paragraph,
.usage-guide__bullet {
  color: #46515e;
  font-size: 13px;
  line-height: 1.7;
}

.usage-guide__bullet {
  display: grid;
  grid-template-columns: 14px 1fr;
  gap: 3px;
}

.usage-guide__bullet-mark {
  padding-top: 1px;
  color: var(--color-pink-strong);
  font-size: 10px;
}

.usage-guide__emphasis {
  color: var(--color-pink-strong);
  font-weight: 750;
}

.usage-guide__ending {
  margin-top: 2px;
  color: var(--color-pink-strong);
  font-size: 16px;
  font-weight: 800;
  text-align: center;
  letter-spacing: 0.5px;
}

@media (max-height: 720px) {
  .usage-guide__paper {
    min-height: 0;
    gap: 13px;
    padding-top: 42px;
    padding-bottom: 18px;
  }
}
</style>
