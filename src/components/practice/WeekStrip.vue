<script setup lang="ts">
import { computed } from "vue";

interface DayCell {
  key: string;
  weekday: string;
  day: string;
  isToday: boolean;
}

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

const days = computed<DayCell[]>(() => {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset);

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    return {
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      weekday: weekdayLabels[date.getDay()],
      day: String(date.getDate()).padStart(2, "0"),
      isToday:
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate(),
    };
  });
});
</script>

<template>
  <view class="week-strip" aria-label="本周日期">
    <view
      v-for="day in days"
      :key="day.key"
      class="week-strip__day"
      :class="{ 'week-strip__day--today': day.isToday }"
    >
      <text class="week-strip__weekday">{{ day.weekday }}</text>
      <text class="week-strip__date">{{ day.day }}</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.week-strip {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.week-strip__day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 64px;
  background: #ffffff;
  border-radius: 18px;
}

.week-strip__day--today {
  background: #ddf6fb;
}

.week-strip__weekday {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 600;
}

.week-strip__day--today .week-strip__weekday {
  color: var(--color-blue);
}

.week-strip__date {
  font-size: 18px;
  font-weight: 500;
}
</style>
