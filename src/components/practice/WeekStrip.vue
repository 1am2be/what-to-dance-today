<script setup lang="ts">
import { computed } from "vue";

interface DayCell {
  key: string;
  weekday: string;
  day: string;
  isSelected: boolean;
  isDisabled: boolean;
}

const props = defineProps<{ selectedDate: string }>();
const emit = defineEmits<{ select: [date: string] }>();

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];
const parseDateKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
};
const toDateKey = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const days = computed<DayCell[]>(() => {
  const selected = parseDateKey(props.selectedDate);
  const start = new Date(selected);
  start.setDate(selected.getDate() - 2);
  const todayKey = toDateKey(new Date());

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = toDateKey(date);

    return {
      key,
      weekday: weekdayLabels[date.getDay()],
      day: String(date.getDate()).padStart(2, "0"),
      isSelected: key === props.selectedDate,
      isDisabled: key > todayKey,
    };
  });
});
</script>

<template>
  <view class="week-strip" aria-label="本周日期">
    <button
      v-for="day in days"
      :key="day.key"
      class="week-strip__day"
      :class="{
        'week-strip__day--selected': day.isSelected,
        'week-strip__day--disabled': day.isDisabled,
      }"
      :aria-label="`选择 ${day.key}`"
      :disabled="day.isDisabled"
      @tap="!day.isDisabled && emit('select', day.key)"
    >
      <text class="week-strip__weekday">{{ day.weekday }}</text>
      <text class="week-strip__date">{{ day.day }}</text>
    </button>
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
  gap: 4px;
  height: 64px;
  margin: 0;
  padding: 0;
  background: #ffffff;
  border: 0;
  border-radius: 18px;
  line-height: 1;
}

.week-strip__day::after {
  border: 0;
}

.week-strip__day--selected {
  background: #ddf6fb;
}

.week-strip__day--disabled {
  opacity: 0.38;
}

.week-strip__weekday {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}

.week-strip__day--selected .week-strip__weekday {
  color: var(--color-blue);
}

.week-strip__date {
  font-size: 18px;
  font-weight: 500;
  line-height: 1;
}
</style>
