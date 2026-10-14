<script setup lang="ts">
import BottomSheet from "@/components/base/BottomSheet.vue";

defineProps<{ open: boolean }>();
defineEmits<{ close: [] }>();
</script>

<template>
  <BottomSheet :open="open" placement="center" @close="$emit('close')">
    <view class="usage-guide">
      <button class="usage-guide__close" aria-label="关闭使用说明" @tap="$emit('close')">
        <text class="usage-guide__close-symbol">×</text>
      </button>

      <view class="usage-guide__content">
      <view class="usage-guide__intro">
        <text class="usage-guide__eyebrow">IDOL DANCE</text>
        <text class="usage-guide__title">使用说明</text>
        <text class="usage-guide__paragraph">记录你为喜欢的 Idol 学过的每一支舞。</text>
      </view>

      <view class="usage-guide__section">
        <text class="usage-guide__heading">怎么用</text>
        <text class="usage-guide__paragraph">学新舞时记录一次，系统会按 <strong>1 / 3 / 7 / 14 天</strong>安排复习；每次练完记一次复习，完成 4 次后，就会进入“已掌握”。以前已经会的舞，也可以直接加入舞单。</text>
      </view>

      <view class="usage-guide__section">
        <text class="usage-guide__heading">练什么</text>
        <view class="usage-guide__bullet">
          <text>01</text>
          <text>“今天复习什么”会优先推荐待复习的舞蹈，也会随机推荐 3 支已掌握的旧舞。</text>
        </view>
        <view class="usage-guide__bullet">
          <text>02</text>
          <text>点开舞蹈详情，可以上传自己的 MP3。同一支舞可以保存多个版本，慢速练习、原速挑战，都准备好！</text>
        </view>
        <view class="usage-guide__bullet">
          <text>03</text>
          <text>“今天复习什么”里点击“随机舞蹈”，就会随机连续播放你上传的音乐。</text>
        </view>
      </view>

      <view class="usage-guide__section">
        <text class="usage-guide__heading">回头看</text>
        <view class="usage-guide__bullet">
          <text>01</text>
          <text>在“练舞记录”里点击“选择日期”，就能看看那一天学了什么、复习了什么。</text>
        </view>
        <view class="usage-guide__bullet">
          <text>02</text>
          <text>在“编辑舞单”和 Artist 右上角的“…”里，可以更换背景、图片、名称和排序，把舞单整理成自己喜欢的样子。</text>
        </view>
      </view>

      <text class="usage-guide__ending">一起开心跳舞吧~</text>
      </view>

    </view>
  </BottomSheet>
</template>

<style scoped lang="scss">
.usage-guide { position: relative; display: flex; max-height: calc(100dvh - 48px - env(safe-area-inset-top) - env(safe-area-inset-bottom)); flex-direction: column; gap: 18px; padding: 26px 22px 20px; color: #fff; background: rgba(20, 22, 27, 0.86); border: 1px solid var(--color-line); box-shadow: 0 20px 54px rgba(0, 0, 0, 0.36); backdrop-filter: blur(26px); }
.usage-guide__close { position: absolute; z-index: 2; top: -14px; right: -14px; display: flex !important; width: 40px; height: 40px; min-width: 40px; min-height: 40px; align-items: center; justify-content: center; padding: 0 !important; color: #fff; background: var(--glass-strong); border: 1px solid var(--color-line); border-radius: 50%; }
.usage-guide__close-symbol { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 24px; font-style: normal; line-height: 40px; text-align: center; }
.usage-guide__content { display: flex; min-height: 0; flex-direction: column; gap: 18px; overflow-y: auto; -webkit-overflow-scrolling: touch; }
.usage-guide__content > view, .usage-guide__ending { flex-shrink: 0; }
.usage-guide__intro, .usage-guide__section { display: flex; flex-direction: column; gap: 8px; }
.usage-guide__eyebrow { color: var(--color-muted); font-size: 10px; font-weight: 700; letter-spacing: 2px; }
.usage-guide__title { font-size: 28px; font-weight: 850; }
.usage-guide__paragraph { color: var(--color-muted); font-size: 12px; line-height: 1.7; }
.usage-guide__heading { padding-bottom: 7px; font-size: 13px; font-weight: 800; letter-spacing: 1px; border-bottom: 1px solid var(--color-line); }
.usage-guide__bullet { display: grid; grid-template-columns: 24px 1fr; gap: 6px; color: var(--color-muted); font-size: 12px; line-height: 1.7; }
.usage-guide__bullet > text:first-child { color: #fff; font-size: 9px; letter-spacing: 1px; }
.usage-guide__bullet strong, .usage-guide__paragraph strong { color: #fff; font-weight: 800; }
.usage-guide__ending { font-size: 15px; font-weight: 800; text-align: center; }
</style>
