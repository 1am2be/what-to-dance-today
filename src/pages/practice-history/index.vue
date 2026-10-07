<script setup lang="ts">
import { computed, onMounted } from "vue";
import BottomNavigation from "@/components/base/BottomNavigation.vue";
import PageHeader from "@/components/base/PageHeader.vue";
import PracticeRecordCard from "@/components/practice/PracticeRecordCard.vue";
import WeekStrip from "@/components/practice/WeekStrip.vue";
import type { PracticeRecordView } from "@/domain/models/practice-record";
import { useAppStore } from "@/stores/app";

interface RecordGroup {
  key: string;
  label: string;
  records: PracticeRecordView[];
}

const monthNames = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

const store = useAppStore();
onMounted(store.initialize);

const openDance = (danceId: string) => {
  const dance = store.dances.find((item) => item.id === danceId);
  if (!dance) return;
  uni.redirectTo({ url: `/pages/library/index?artistId=${dance.artistId}&danceId=${dance.id}` });
};

const toLocalDateKey = (value: string) => {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const currentMonthLabel = computed(() => {
  const now = new Date();
  const count = store.practiceRecordViews.length;
  return `${monthNames[now.getMonth()]} · ${String(count).padStart(2, "0")} SESSIONS`;
});

const groups = computed<RecordGroup[]>(() => {
  const now = new Date();
  const todayKey = toLocalDateKey(now.toISOString());
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayKey = toLocalDateKey(yesterday.toISOString());
  const grouped = new Map<string, PracticeRecordView[]>();

  store.practiceRecordViews.forEach((record) => {
    const key = toLocalDateKey(record.practicedAt);
    grouped.set(key, [...(grouped.get(key) ?? []), record]);
  });

  return [...grouped.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([key, records]) => {
      const [, month, day] = key.split("-");
      const relativeLabel = key === todayKey ? "今天" : key === yesterdayKey ? "昨天" : "";
      return {
        key,
        records,
        label: `${relativeLabel ? `${relativeLabel} · ` : ""}${month} 月 ${day} 日`,
      };
    });
});
</script>

<template>
  <view class="mobile-page history-page">
    <view class="page-content">
      <PageHeader :eyebrow="currentMonthLabel" title="练舞记录" />

      <view class="history-week">
        <WeekStrip />
      </view>

      <view class="history-groups">
        <view v-for="group in groups" :key="group.key" class="history-group">
          <text class="history-group__title">{{ group.label }}</text>
          <view class="history-group__records">
            <PracticeRecordCard
              v-for="record in group.records"
              :key="record.id"
              :record="record"
              @select="openDance"
            />
          </view>
        </view>
      </view>
    </view>

    <BottomNavigation active="history" />
  </view>
</template>

<style scoped lang="scss">
.history-page {
  background: var(--color-pink-page);
}

.history-week {
  margin-top: 30px;
}

.history-groups {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 28px;
}

.history-group {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.history-group__title {
  font-size: 16px;
  font-weight: 650;
}

.history-group__records {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
