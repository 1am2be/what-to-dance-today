<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BottomSheet from "@/components/base/BottomSheet.vue";

const props = defineProps<{ open: boolean; selectedDate: string }>();
const emit = defineEmits<{ close: []; select: [value: string] }>();
const year = ref(new Date().getFullYear());
const month = ref(new Date().getMonth());
const keyFor = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
watch(() => props.open, (open) => {
  if (!open) return;
  const [selectedYear, selectedMonth] = props.selectedDate.split("-").map(Number);
  year.value = selectedYear;
  month.value = selectedMonth - 1;
});
const cells = computed(() => {
  const today = keyFor(new Date());
  const blanks = new Date(year.value, month.value, 1).getDay();
  const count = new Date(year.value, month.value + 1, 0).getDate();
  return Array.from({ length: blanks + count }, (_, index) => {
    const day = index - blanks + 1;
    const key = day > 0 ? keyFor(new Date(year.value, month.value, day)) : "";
    return { day, key, disabled: key > today };
  });
});
const nextMonthDisabled = computed(() => {
  const now = new Date();
  return year.value === now.getFullYear() && month.value === now.getMonth();
});
const move = (direction: number) => {
  if (direction > 0 && nextMonthDisabled.value) return;
  const next = new Date(year.value, month.value + direction, 1);
  year.value = next.getFullYear();
  month.value = next.getMonth();
};
const select = (value: string) => { emit("select", value); emit("close"); };
</script>

<template>
  <BottomSheet :open="open" @close="emit('close')">
    <view class="calendar-header"><text>选择日期</text><button aria-label="关闭日期选择" @tap="emit('close')">×</button></view>
    <view class="calendar-month"><button aria-label="上个月" @tap="move(-1)">‹</button><text>{{ year }} 年 {{ month + 1 }} 月</text><button :disabled="nextMonthDisabled" aria-label="下个月" @tap="move(1)">›</button></view>
    <view class="calendar-week"><text v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day">{{ day }}</text></view>
    <view class="calendar-days">
      <view v-for="(cell, index) in cells" :key="cell.key || `blank-${index}`" class="calendar-cell">
        <button v-if="cell.key" :disabled="cell.disabled" :class="{ selected: cell.key === selectedDate }" :aria-label="cell.key" :aria-pressed="cell.key === selectedDate" @tap="select(cell.key)">{{ cell.day }}</button>
      </view>
    </view>
  </BottomSheet>
</template>

<style scoped lang="scss">
.calendar-header, .calendar-month { display: flex; align-items: center; justify-content: space-between; }
.calendar-header { margin-bottom: 20px; font-size: 24px; font-weight: 800; }
.calendar-header button, .calendar-month button { display: flex; width: 36px; height: 36px; align-items: center; justify-content: center; color: #fff; font-size: 22px; line-height: 1; background: var(--glass); border: 1px solid var(--color-line); }
.calendar-month { margin-bottom: 12px; font-size: 15px; }
.calendar-week, .calendar-days { display: flex; flex-wrap: wrap; }
.calendar-week > text, .calendar-cell { display: flex; width: calc(100% / 7); flex: 0 0 calc(100% / 7); height: 44px; align-items: center; justify-content: center; }
.calendar-week { color: var(--color-muted); font-size: 12px; }
.calendar-cell button { display: flex; width: 100%; height: 44px; align-items: center; justify-content: center; color: var(--color-muted); font-size: 14px; line-height: 1; border: 1px solid transparent; }
.calendar-cell button.selected { color: #fff; background: var(--glass-strong); border-color: var(--color-line); }
button[disabled] { opacity: 0.3; }
</style>
