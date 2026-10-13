<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BottomSheet from "@/components/base/BottomSheet.vue";
import type { Dance } from "@/domain/models/dance";
import { useAppStore } from "@/stores/app-v2";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; add: [] }>();
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
  const nextInterval = ({ 1: 3, 2: 7, 3: 14 } as Record<number, number>)[dance.reviewRound];
  uni.showToast({
    title: dance.state === "mastered"
      ? "复习已记录 · 已掌握 ✦"
      : `复习已记录 · 下一次建议 ${nextInterval} 天后 ✦`,
    icon: "none",
  });
};
</script>

<template>
  <BottomSheet :open="open" @close="$emit('close')">
    <view class="practice-sheet">
      <text class="sheet-title">今天复习什么</text>

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
        <button class="empty-copy__action" @tap="emit('add')">＋ 添加第一支舞</button>
      </view>
    </view>
  </BottomSheet>
</template>

<style scoped lang="scss">
.practice-sheet { display: flex; flex-direction: column; gap: 12px; padding-bottom: 8px; }
.sheet-title { margin-bottom: 2px; font-size: 24px; font-weight: 800; }
.section-heading { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; }
.section-heading button { display: flex; min-width: 62px; height: 28px; align-items: center; justify-content: center; padding: 0 10px; color: #fff; font-size: 11px; line-height: 1; letter-spacing: 0; background: var(--glass); border: 1px solid var(--color-line); }
.section-heading--pink { color: #ffffff; }
.section-heading--green { color: rgba(255, 255, 255, 0.68); }
.dance-list { display: flex; flex-direction: column; gap: 8px; }
.dance-row { display: flex; min-height: 72px; align-items: center; padding: 12px 12px 12px 14px; background: var(--glass); border: 1px solid var(--color-line); }
.dance-row__number { display: grid; flex: 0 0 34px; width: 34px; height: 34px; margin-right: 10px; color: #fff; font-size: 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid var(--color-line); place-items: center; }
.dance-row__number--pink,
.dance-row__number--green { color: #fff; }
.dance-row__content { display: flex; flex: 1; flex-direction: column; gap: 4px; min-width: 0; }
.dance-row__title { overflow: hidden; font-size: 16px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.dance-row__meta { overflow: hidden; color: var(--color-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.dance-row__action { display: flex; flex: 0 0 78px; height: 30px; align-items: center; justify-content: center; margin-left: 8px; padding: 0 10px; color: #fff; font-size: 13px; line-height: 1; background: rgba(255, 255, 255, 0.12); border: 1px solid var(--color-line); }
.dance-row__action--pink,
.dance-row__action--green { color: #fff; }
.empty-copy { display: flex; flex-direction: column; gap: 4px; padding: 14px; color: var(--color-muted); font-size: 13px; background: var(--glass); border: 1px solid var(--color-line); }
.empty-copy text:first-child { color: var(--color-ink); font-weight: 650; }
.empty-copy--large { padding: 46px 18px; text-align: center; }
.empty-copy__action { display: flex; height: 40px; align-items: center; justify-content: center; align-self: center; margin-top: 10px !important; padding: 0 16px; color: #fff; font-size: 12px; font-weight: 700; background: var(--glass-strong); border: 1px solid var(--color-line); }
</style>
