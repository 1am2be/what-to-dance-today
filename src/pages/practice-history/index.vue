<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
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

const selectDateFromPicker = (event: { detail: { value: string } }) => {
  selectDate(event.detail.value);
};
</script>

<template>
  <view class="mobile-page history-page">
    <view class="page-content">
      <PageHeader :eyebrow="currentMonthLabel" title="练舞记录">
        <template #title-action>
          <picker
            class="history-date-picker"
            mode="date"
            :value="selectedDate"
            :end="todayDate"
            @change="selectDateFromPicker"
          >
            <text class="history-date-trigger">选择日期</text>
          </picker>
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
          <text>这一天还没有练舞记录</text>
          <text>跳一支喜欢的舞吧 ✦</text>
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

.history-date-picker {
  flex: 0 0 auto;
}

.history-date-trigger {
  color: #ffffff;
  font-size: 11px;
  font-weight: 750;
  line-height: 1;
  letter-spacing: 0.4px;
  text-shadow:
    0 1px 0 rgba(219, 82, 139, 0.62),
    0 2px 5px rgba(219, 82, 139, 0.22);
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
  background: rgba(255, 255, 255, 0.62);
  border-radius: 20px;
}

.history-empty text:first-child {
  color: var(--color-ink);
  font-weight: 650;
}
</style>
