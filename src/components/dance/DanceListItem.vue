<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Dance, ScopeType } from "@/domain/models/dance";
import { DanceValidationError, useAppStore } from "@/stores/app";

const props = defineProps<{ dance: Dance; index: number; initiallyExpanded?: boolean }>();
const store = useAppStore();
const expanded = ref(Boolean(props.initiallyExpanded));
const confirmReview = ref(false);
const editingScope = ref(false);
const confirmExpansion = ref(false);
const scopeType = ref<ScopeType>(props.dance.scopeType);
const customScope = ref(props.dance.scopeType === "custom" ? props.dance.scopeText : "");

watch(() => props.initiallyExpanded, (value) => {
  if (value) expanded.value = true;
});

const scopeOptions: Array<{ value: ScopeType; label: string }> = [
  { value: "full", label: "全曲" },
  { value: "half", label: "半曲" },
  { value: "chorus", label: "副歌" },
  { value: "custom", label: "自定义" },
];

const practiceCount = computed(() => store.practiceRecords.filter((record) => record.danceId === props.dance.id).length);
const statusLabel = computed(() => {
  if (props.dance.state === "mastered") return "已掌握";
  return props.dance.nextReviewAt && new Date(props.dance.nextReviewAt) <= new Date() ? "待复习" : "复习中";
});
const nextScopeText = computed(() => scopeType.value === "custom"
  ? customScope.value.trim()
  : scopeOptions.find((item) => item.value === scopeType.value)?.label ?? "");

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

const startEditing = () => {
  scopeType.value = props.dance.scopeType;
  customScope.value = props.dance.scopeType === "custom" ? props.dance.scopeText : "";
  confirmExpansion.value = false;
  editingScope.value = true;
};

const scopeWillExpand = () => {
  if (props.dance.scopeType === scopeType.value && props.dance.scopeText.trim() === nextScopeText.value) return false;
  const rank: Record<Exclude<ScopeType, "custom">, number> = { chorus: 1, half: 2, full: 3 };
  if (scopeType.value === "custom") return nextScopeText.value.length > props.dance.scopeText.trim().length;
  if (props.dance.scopeType === "custom") return scopeType.value === "full";
  return rank[scopeType.value] > rank[props.dance.scopeType];
};

const saveScope = () => {
  if (!nextScopeText.value) {
    uni.showToast({ title: "请填写具体学习范围", icon: "none" });
    return;
  }
  if (scopeWillExpand()) {
    confirmExpansion.value = true;
    return;
  }
  completeScopeUpdate();
};

const completeScopeUpdate = () => {
  try {
    const result = store.updateDanceScope(props.dance.id, scopeType.value, nextScopeText.value);
    editingScope.value = false;
    confirmExpansion.value = false;
    uni.showToast({
      title: result === "reset" ? "范围已更新 · 已重新开始复习" : result === "unchanged" ? "学习范围没有变化" : "学习范围已更新",
      icon: "none",
    });
  } catch (error) {
    uni.showToast({ title: error instanceof DanceValidationError ? "请填写具体学习范围" : "保存失败，请再试一次", icon: "none" });
  }
};

const completeReview = () => {
  const previousState = props.dance.state;
  store.recordReview(props.dance.id);
  confirmReview.value = false;
  uni.showToast({
    title: previousState === "mastered" || props.dance.state === "mastered" ? "复习已记录 · 已掌握 ✦" : "复习已记录 ✦",
    icon: "none",
  });
};

const confirmDeleteDance = () => {
  uni.showModal({
    title: `删除 ${props.dance.songTitle}？`,
    content: "删除了就找不回来了哦~",
    confirmText: "删除",
    confirmColor: "#EC6F9E",
    success: ({ confirm }) => {
      if (!confirm) return;
      store.deleteDance(props.dance.id);
      uni.showToast({ title: "舞蹈记录已删除", icon: "none" });
    },
  });
};
</script>

<template>
  <view class="dance-card" :class="{ 'dance-card--expanded': expanded }">
    <view class="dance-card__summary" role="button" @tap="expanded = !expanded">
      <text class="dance-card__number" :class="`dance-card__number--${dance.state}`">
        {{ String(index + 1).padStart(2, "0") }}
      </text>
      <view class="dance-card__content">
        <text class="dance-card__title">{{ dance.songTitle }}</text>
        <text class="dance-card__meta">{{ dance.scopeText }} · {{ practiceCount }} 次练习</text>
      </view>
      <view class="dance-card__status-column">
        <text class="dance-card__status" :class="`dance-card__status--${dance.state}`">{{ statusLabel }}</text>
        <button v-if="expanded" class="dance-card__delete" @tap.stop="confirmDeleteDance">删除这条记录</button>
      </view>
    </view>

    <view v-if="expanded" class="dance-card__details">
      <view class="detail-grid">
        <view><text>学习日期</text><strong>{{ formatDate(dance.learnedAt) }}</strong></view>
        <view><text>最近练习</text><strong>{{ formatDate(dance.lastReviewAt) }}</strong></view>
        <view><text>累计练习</text><strong>{{ practiceCount }} 次</strong></view>
        <view><text>当前状态</text><strong>{{ statusLabel }}</strong></view>
        <view v-if="dance.state !== 'mastered'" class="detail-grid__wide">
          <text>下次建议复习</text><strong>{{ formatDate(dance.nextReviewAt) }}</strong>
        </view>
      </view>

      <view v-if="editingScope" class="scope-editor">
        <text class="scope-editor__label">编辑学习范围</text>
        <view class="scope-editor__options">
          <button
            v-for="option in scopeOptions"
            :key="option.value"
            :class="{ active: scopeType === option.value }"
            @tap="scopeType = option.value"
          >{{ option.label }}</button>
        </view>
        <input v-if="scopeType === 'custom'" v-model="customScope" placeholder="填写具体学习范围" />
        <view v-if="confirmExpansion" class="scope-editor__warning">
          <text>学习范围扩大后，将重新开始复习计划。之前的练习记录会保留。</text>
          <button @tap="completeScopeUpdate">更新并重新复习</button>
        </view>
        <view v-else class="scope-editor__actions">
          <button @tap="editingScope = false">取消</button>
          <button class="primary" @tap="saveScope">保存</button>
        </view>
      </view>

      <view v-else-if="confirmReview" class="review-confirm">
        <text>今天复习了 {{ dance.songTitle }} · {{ dance.scopeText }}？</text>
        <view>
          <button @tap="confirmReview = false">取消</button>
          <button class="primary" @tap="completeReview">完成复习</button>
        </view>
      </view>

      <view v-else class="dance-card__actions">
        <button @tap="startEditing">编辑学习范围</button>
        <button class="primary" @tap="confirmReview = true">记一次复习</button>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.dance-card { overflow: hidden; background: #fff; border: 1px solid var(--color-line); border-radius: 16px; }
.dance-card--expanded { box-shadow: 0 12px 28px rgba(44, 73, 91, 0.08); }
.dance-card__summary { display: flex; align-items: center; width: 100%; min-height: 82px; padding: 14px; text-align: left; }
.dance-card__number { display: grid; flex: 0 0 34px; width: 34px; height: 34px; margin-right: 10px; place-items: center; font-size: 12px; border-radius: 11px; }
.dance-card__number--reviewing { color: var(--color-pink-strong); background: #ffe5f2; }
.dance-card__number--mastered { color: var(--color-green); background: #d9f8f1; }
.dance-card__content { display: flex; flex: 1; flex-direction: column; gap: 5px; min-width: 0; }
.dance-card__title { overflow: hidden; font-size: 17px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.dance-card__meta { overflow: hidden; color: var(--color-muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.dance-card__status-column { display: flex; flex: 0 0 84px; flex-direction: column; align-items: center; gap: 5px; margin-left: 8px; }
.dance-card__status { display: flex; width: 78px; align-items: center; justify-content: center; height: 30px; font-size: 13px; border-radius: 999px; }
.dance-card__status--reviewing { color: var(--color-pink-strong); background: #ffe5f2; }
.dance-card__status--mastered { color: var(--color-green); background: #d9f8f1; }
.dance-card__delete { width: 100%; margin: 0; padding: 0; color: var(--color-muted); font-size: 12px; line-height: 1.2; text-align: center; background: transparent; }
.dance-card__details { padding: 0 14px 14px; border-top: 1px solid #edf1f4; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 14px 0; }
.detail-grid view { display: flex; flex-direction: column; gap: 3px; }
.detail-grid text { color: var(--color-muted); font-size: 11px; }
.detail-grid strong { font-size: 13px; font-weight: 650; }
.detail-grid__wide { grid-column: 1 / -1; }
.dance-card__actions, .scope-editor__actions, .review-confirm view { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.dance-card__actions button, .scope-editor__actions button, .review-confirm button { display: flex; align-items: center; justify-content: center; height: 38px; color: var(--color-muted); background: #f3f6f8; border-radius: 999px; }
button.primary { color: #fff; background: var(--color-aqua); }
.review-confirm { display: flex; flex-direction: column; gap: 10px; padding: 12px; font-size: 12px; background: #f3fbfc; border-radius: 12px; }
.scope-editor { display: flex; flex-direction: column; gap: 9px; }
.scope-editor__label { font-size: 12px; font-weight: 650; }
.scope-editor__options { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.scope-editor__options button { display: flex; align-items: center; justify-content: center; height: 34px; color: var(--color-muted); font-size: 11px; background: #f3f6f8; border-radius: 9px; }
.scope-editor__options button.active { color: #168e82; background: #d9f8f1; }
.scope-editor input { height: 42px; padding: 0 12px; font-size: 13px; border: 1px solid var(--color-line); border-radius: 10px; }
.scope-editor__warning { display: flex; flex-direction: column; gap: 9px; padding: 11px; color: #8c5b72; font-size: 11px; background: #fff0f6; border-radius: 10px; }
.scope-editor__warning button { display: flex; align-items: center; justify-content: center; height: 36px; color: #fff; background: var(--color-pink); border-radius: 999px; }
</style>
