<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BottomSheet from "@/components/base/BottomSheet.vue";
import type { Dance } from "@/domain/models/dance";
import { useAppStore } from "@/stores/app";

const props = defineProps<{ open: boolean }>();
defineEmits<{ close: [] }>();
const store = useAppStore();

const showAllDue = ref(false);
const randomIds = ref<string[]>([]);
const pendingId = ref("");

const due = computed(() => showAllDue.value ? store.dueDances : store.dueDances.slice(0, 3));
const randomDances = computed(() => randomIds.value
  .map((id) => store.dances.find((dance) => dance.id === id))
  .filter((dance): dance is Dance => Boolean(dance)));

const shuffleRandom = (excludeId = "") => {
  randomIds.value = [...store.masteredDances]
    .filter((dance) => dance.id !== excludeId)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((dance) => dance.id);
};

watch(() => props.open, (open) => {
  if (!open) return;
  showAllDue.value = false;
  pendingId.value = "";
  shuffleRandom();
});

const artistName = (dance: Dance) => store.artists.find((artist) => artist.id === dance.artistId)?.name ?? "";
const lastPracticeLabel = (dance: Dance) => {
  const latest = store.practiceRecords
    .filter((record) => record.danceId === dance.id)
    .sort((left, right) => right.practicedAt.localeCompare(left.practicedAt))[0];
  if (!latest) return "还没有练习记录";
  const days = Math.max(0, Math.floor((Date.now() - new Date(latest.practicedAt).getTime()) / 86400000));
  return days === 0 ? "今天练过" : `上次练习 ${days} 天前`;
};

const review = (dance: Dance, random: boolean) => {
  if (pendingId.value !== dance.id) {
    pendingId.value = dance.id;
    return;
  }
  store.recordReview(dance.id);
  pendingId.value = "";
  if (random) shuffleRandom(dance.id);
  uni.showToast({
    title: dance.state === "mastered" ? "复习已记录 · 已掌握 ✦" : "复习已记录 ✦",
    icon: "none",
  });
};
</script>

<template>
  <BottomSheet :open="open" @close="$emit('close')">
    <view class="practice-sheet">
      <text class="sheet-title">今天复习什么 ✦</text>

      <template v-if="store.dances.length">
        <view class="section-heading section-heading--pink">
          <text>TOP 3 · 待复习</text>
          <button v-if="store.dueDances.length > 3" @tap="showAllDue = !showAllDue">
            {{ showAllDue ? "收起" : `查看全部（${store.dueDances.length}）` }}
          </button>
        </view>

        <view v-if="due.length" class="dance-list">
          <view v-for="(dance, index) in due" :key="dance.id" class="dance-row">
            <text class="dance-row__number dance-row__number--pink">#{{ index + 1 }}</text>
            <view class="dance-row__content">
              <text class="dance-row__title">{{ dance.songTitle }}</text>
              <text class="dance-row__meta">{{ artistName(dance) }} · {{ dance.scopeText }} · {{ lastPracticeLabel(dance) }}</text>
            </view>
            <button class="dance-row__action dance-row__action--pink" @tap="review(dance, false)">
              {{ pendingId === dance.id ? "完成" : "复习" }}
            </button>
          </view>
        </view>
        <view v-else class="empty-copy">
          <text>今天没有必须复习的舞</text>
          <text>记得不错 ✦</text>
        </view>

        <view class="section-heading section-heading--green">
          <text>RANDOM 3 · 已掌握旧舞</text>
          <button v-if="store.masteredDances.length > 3" @tap="shuffleRandom()">换一批</button>
        </view>

        <view v-if="randomDances.length" class="dance-list">
          <view v-for="(dance, index) in randomDances" :key="dance.id" class="dance-row">
            <text class="dance-row__number dance-row__number--green">0{{ index + 1 }}</text>
            <view class="dance-row__content">
              <text class="dance-row__title">{{ dance.songTitle }}</text>
              <text class="dance-row__meta">{{ artistName(dance) }} · {{ dance.scopeText }} · 随机复习</text>
            </view>
            <button class="dance-row__action dance-row__action--green" @tap="review(dance, true)">
              {{ pendingId === dance.id ? "完成" : "已掌握" }}
            </button>
          </view>
        </view>
        <view v-else class="empty-copy">
          <text>还没有已掌握的舞</text>
          <text>完成 4 次复习后，它们会来到这里。</text>
        </view>
      </template>

      <view v-else class="empty-copy empty-copy--large">
        <text>舞单还是空的</text>
        <text>先记录一支学过的舞吧。</text>
      </view>
    </view>
  </BottomSheet>
</template>

<style scoped lang="scss">
.practice-sheet { display: flex; flex-direction: column; gap: 12px; padding-bottom: 8px; }
.sheet-title { margin-bottom: 2px; font-size: 24px; font-weight: 800; }
.section-heading { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; }
.section-heading button { display: flex; align-items: center; justify-content: center; min-width: 62px; height: 28px; padding: 0 10px; font-size: 11px; line-height: 1; letter-spacing: 0; background: #f5f7f8; border-radius: 999px; }
.section-heading--pink { color: var(--color-pink-strong); }
.section-heading--green { color: var(--color-green); }
.dance-list { display: flex; flex-direction: column; gap: 8px; }
.dance-row { display: flex; align-items: center; min-height: 72px; padding: 12px 12px 12px 14px; border: 1px solid var(--color-line); border-radius: 16px; }
.dance-row__number { display: grid; flex: 0 0 34px; width: 34px; height: 34px; margin-right: 10px; place-items: center; font-size: 12px; border-radius: 11px; }
.dance-row__number--pink { color: var(--color-pink-strong); background: #ffe5f2; }
.dance-row__number--green { color: var(--color-green); background: #dcfaf3; }
.dance-row__content { display: flex; flex: 1; flex-direction: column; gap: 4px; min-width: 0; }
.dance-row__title { overflow: hidden; font-size: 16px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.dance-row__meta { overflow: hidden; color: var(--color-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.dance-row__action { display: flex; align-items: center; justify-content: center; flex: 0 0 78px; height: 30px; margin-left: 8px; padding: 0 10px; font-size: 13px; line-height: 1; border-radius: 999px; }
.dance-row__action--pink { color: var(--color-pink-strong); background: #ffe5f2; }
.dance-row__action--green { color: var(--color-green); background: #dcfaf3; }
.empty-copy { display: flex; flex-direction: column; gap: 4px; padding: 14px; color: var(--color-muted); font-size: 13px; background: #f7f9fa; border-radius: 14px; }
.empty-copy text:first-child { color: var(--color-ink); font-weight: 650; }
.empty-copy--large { padding: 46px 18px; text-align: center; }
</style>
