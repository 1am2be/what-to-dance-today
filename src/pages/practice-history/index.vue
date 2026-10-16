<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import AppBackground from "@/components/base/AppBackground.vue";
import BottomNavigation from "@/components/base/BottomNavigation.vue";
import PageHeader from "@/components/base/PageHeader.vue";
import PracticeRecordCard from "@/components/practice/PracticeRecordCard.vue";
import WeekStrip from "@/components/practice/WeekStrip.vue";
import DateCalendarSheet from "@/components/practice/DateCalendarSheet.vue";
import type { PracticeRecordView } from "@/domain/models/practice-record";
import { useAppStore } from "@/stores/app-v2";

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
onMounted(() => { void store.initialize(); });

const toDateKey = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};
const parseDateKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
};
const selectedDate = ref(toDateKey(new Date()));
const calendarOpen = ref(false);
const todayDate = toDateKey(new Date());

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
  const selected = parseDateKey(selectedDate.value);
  const count = store.practiceRecordViews.length;
  return `${monthNames[selected.getMonth()]} · ${String(count).padStart(2, "0")} SESSIONS`;
});

const groups = computed<RecordGroup[]>(() => {
  const now = new Date();
  const todayKey = toDateKey(now);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayKey = toDateKey(yesterday);
  const grouped = new Map<string, PracticeRecordView[]>();

  store.practiceRecordViews
    .filter((record) => toLocalDateKey(record.practicedAt) === selectedDate.value)
    .forEach((record) => {
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

const selectDate = (value: string) => {
  if (value > todayDate) return;
  selectedDate.value = value;
};

</script>

<template>
  <view class="mobile-page history-page">
    <AppBackground
      :src="store.backgroundUrl"
      :position-x="store.settings.backgroundPositionX"
      :position-y="store.settings.backgroundPositionY"
    />
    <view class="page-content">
      <PageHeader :eyebrow="currentMonthLabel" title="练舞记录">
        <template #title-action>
          <button class="history-date-picker" @tap="calendarOpen = true">
            <text class="history-date-trigger">选择日期</text>
          </button>
        </template>
      </PageHeader>

      <view class="history-week">
        <WeekStrip :selected-date="selectedDate" @select="selectDate" />
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
        <view v-if="!groups.length" class="history-empty">
          <template v-if="!store.practiceRecordViews.length">
            <text>还没有练舞记录</text>
            <text>第一次练舞后，记录会出现在这里。</text>
          </template>
          <template v-else>
            <text>这一天还没有练舞记录</text>
            <text>选择其他日期看看吧 ✦</text>
          </template>
        </view>
      </view>
    </view>

    <BottomNavigation active="history" />
    <DateCalendarSheet :open="calendarOpen" :selected-date="selectedDate" @select="selectDate" @close="calendarOpen = false" />
  </view>
</template>

<style scoped lang="scss">
.history-page {
  background: #111318;
}

.page-content { position: relative; z-index: 2; }

.history-week {
  margin-top: 30px;
}

.history-date-picker {
  display: inline-flex;
  height: 22px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 0 1px;
  background: transparent;
  border: 0;
}

.history-date-trigger {
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
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

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 42px 18px;
  color: var(--color-muted);
  font-size: 13px;
  text-align: center;
  background: var(--glass);
  border: 1px solid var(--color-line);
  backdrop-filter: blur(12px);
}

.history-empty text:first-child {
  color: var(--color-ink);
  font-weight: 650;
}
</style>
