<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import BottomSheet from "@/components/base/BottomSheet.vue";

export interface ReorderItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
}

const props = defineProps<{
  open: boolean;
  title: string;
  items: ReorderItem[];
}>();
const emit = defineEmits<{ close: []; save: [ids: string[]] }>();
const orderedIds = ref<string[]>([]);
type UniElementRef = HTMLElement | { $el?: HTMLElement } | null;
const listElement = ref<UniElementRef>(null);
const draggingId = ref("");
let activeTouchId: number | null = null;
let dragInput: "mouse" | "touch" | "" = "";

watch(() => props.open, (open) => {
  if (open) orderedIds.value = props.items.map((item) => item.id);
}, { immediate: true });

const orderedItems = () => orderedIds.value
  .map((id) => props.items.find((item) => item.id === id))
  .filter((item): item is ReorderItem => Boolean(item));

const moveTo = (id: string, targetId: string) => {
  if (id === targetId) return;
  const next = [...orderedIds.value];
  const from = next.indexOf(id);
  const target = next.indexOf(targetId);
  if (from < 0 || target < 0) return;
  next.splice(from, 1);
  next.splice(target, 0, id);
  orderedIds.value = next;
};

const moveBy = (id: string, offset: number) => {
  const next = [...orderedIds.value];
  const from = next.indexOf(id);
  const target = from + offset;
  if (from < 0 || target < 0 || target >= next.length) return;
  next.splice(from, 1);
  next.splice(target, 0, id);
  orderedIds.value = next;
};

const resolveListElement = () => {
  const target = listElement.value;
  if (!target || typeof HTMLElement === "undefined") return null;
  if (target instanceof HTMLElement) return target;
  return target.$el instanceof HTMLElement ? target.$el : null;
};

const moveAtClientY = (clientY: number) => {
  const id = draggingId.value;
  const list = resolveListElement();
  if (!id || !list) return;

  const bounds = list.getBoundingClientRect();
  if (clientY < bounds.top + 52) list.scrollTop = Math.max(0, list.scrollTop - 18);
  else if (clientY > bounds.bottom - 52) list.scrollTop += 18;

  const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-reorder-id]"));
  const currentIndex = rows.findIndex((row) => row.dataset.reorderId === id);
  if (currentIndex < 0) return;

  const previous = rows[currentIndex - 1];
  const next = rows[currentIndex + 1];
  if (previous) {
    const previousBounds = previous.getBoundingClientRect();
    if (clientY < (previousBounds.top + previousBounds.bottom) / 2) {
      moveTo(id, previous.dataset.reorderId ?? "");
      return;
    }
  }
  if (next) {
    const nextBounds = next.getBoundingClientRect();
    if (clientY > (nextBounds.top + nextBounds.bottom) / 2) {
      moveTo(id, next.dataset.reorderId ?? "");
    }
  }
};

const removeGlobalListeners = () => {
  if (typeof window === "undefined") return;
  window.removeEventListener("mousemove", continueMouseDrag);
  window.removeEventListener("mouseup", stopDrag);
  window.removeEventListener("touchmove", continueTouchDrag);
  window.removeEventListener("touchend", stopDrag);
  window.removeEventListener("touchcancel", stopDrag);
};

const stopDrag = () => {
  draggingId.value = "";
  activeTouchId = null;
  dragInput = "";
  removeGlobalListeners();
};

const continueMouseDrag = (event: MouseEvent) => {
  if (dragInput !== "mouse" || !draggingId.value) return;
  event.preventDefault();
  moveAtClientY(event.clientY);
};

const beginMouseDrag = (event: MouseEvent, id: string) => {
  if (dragInput) return;
  if (typeof window === "undefined") return;
  draggingId.value = id;
  dragInput = "mouse";
  window.addEventListener("mousemove", continueMouseDrag, { passive: false });
  window.addEventListener("mouseup", stopDrag);
};

const findTouch = (event: TouchEvent) => {
  const touches = Array.from(event.touches);
  return activeTouchId === null
    ? touches[0]
    : touches.find((touch) => touch.identifier === activeTouchId);
};

const continueTouchDrag = (event: TouchEvent) => {
  if (dragInput !== "touch" || !draggingId.value) return;
  const touch = findTouch(event);
  if (!touch) return;
  event.preventDefault();
  moveAtClientY(touch.clientY);
};

const beginTouchDrag = (event: TouchEvent, id: string) => {
  if (dragInput || typeof window === "undefined") return;
  const touch = event.changedTouches[0];
  if (!touch) return;
  event.preventDefault();
  draggingId.value = id;
  activeTouchId = touch.identifier;
  dragInput = "touch";
  window.addEventListener("touchmove", continueTouchDrag, { passive: false });
  window.addEventListener("touchend", stopDrag);
  window.addEventListener("touchcancel", stopDrag);
};

onBeforeUnmount(stopDrag);
</script>

<template>
  <BottomSheet :open="open" @close="$emit('close')">
    <view class="reorder-sheet">
      <view class="reorder-sheet__header">
        <view>
          <text class="reorder-sheet__title">{{ title }}</text>
          <text class="reorder-sheet__hint">按住右侧手柄拖动排序</text>
        </view>
        <button aria-label="关闭" @tap="$emit('close')"><text class="reorder-sheet__close-symbol">×</text></button>
      </view>

      <view ref="listElement" class="reorder-sheet__list">
        <view
          v-for="(item, index) in orderedItems()"
          :key="item.id"
          class="reorder-row"
          :class="{ 'reorder-row--dragging': draggingId === item.id }"
          :data-reorder-id="item.id"
        >
          <text class="reorder-row__index">{{ String(index + 1).padStart(2, "0") }}</text>
          <image v-if="item.imageUrl" class="reorder-row__image" :src="item.imageUrl" mode="aspectFill" />
          <view class="reorder-row__copy">
            <text>{{ item.title }}</text>
            <text v-if="item.subtitle">{{ item.subtitle }}</text>
          </view>
          <view
            class="reorder-row__handle"
            role="button"
            tabindex="0"
            aria-label="按住拖动排序"
            @mousedown.stop.prevent="beginMouseDrag($event, item.id)"
            @touchstart.stop.prevent="beginTouchDrag($event, item.id)"
            @keydown.up.prevent="moveBy(item.id, -1)"
            @keydown.down.prevent="moveBy(item.id, 1)"
          ><text>≡</text></view>
        </view>
      </view>

      <button class="reorder-sheet__save" @tap="emit('save', orderedIds)">保存顺序</button>
    </view>
  </BottomSheet>
</template>

<style scoped lang="scss">
.reorder-sheet { display: flex; min-height: 0; flex-direction: column; gap: 18px; }
.reorder-sheet__header { display: flex; align-items: flex-start; justify-content: space-between; }
.reorder-sheet__header > view { display: flex; flex-direction: column; gap: 4px; }
.reorder-sheet__title { font-size: 24px; font-weight: 800; }
.reorder-sheet__hint { color: var(--color-muted); font-size: 12px; }
.reorder-sheet__header > button { display: flex !important; width: 36px; height: 36px; min-width: 36px; min-height: 36px; align-items: center; justify-content: center; padding: 0 !important; color: #fff; background: var(--glass-strong); border: 1px solid var(--color-line); }
.reorder-sheet__close-symbol { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 23px; line-height: 36px; text-align: center; }
.reorder-sheet__list { display: flex; max-height: min(56dvh, 520px); flex-direction: column; gap: 8px; overflow-y: auto; overscroll-behavior: contain; }
.reorder-row { display: flex; min-height: 62px; flex: 0 0 auto; align-items: center; gap: 10px; padding: 8px 10px; background: var(--glass); border: 1px solid var(--color-line); transition: opacity 120ms ease, transform 120ms ease; }
.reorder-row--dragging { z-index: 2; opacity: 0.58; transform: scale(0.985); }
.reorder-row__index { width: 22px; color: var(--color-muted); font-size: 11px; }
.reorder-row__image { width: 44px; height: 44px; object-fit: cover; }
.reorder-row__copy { display: flex; flex: 1; flex-direction: column; gap: 3px; min-width: 0; }
.reorder-row__copy text:first-child { overflow: hidden; font-size: 14px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.reorder-row__copy text:last-child:not(:first-child) { color: var(--color-muted); font-size: 11px; }
.reorder-row__handle { display: flex !important; width: 38px; height: 38px; min-width: 38px; min-height: 38px; flex: 0 0 38px; align-items: center; justify-content: center; padding: 0 !important; color: #fff; background: var(--glass-strong); border: 1px solid var(--color-line); touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab; }
.reorder-row__handle text { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 24px; line-height: 1; transform: rotate(90deg); }
.reorder-row__handle:active { cursor: grabbing; }
.reorder-sheet__save { position: sticky; z-index: 3; bottom: 0; display: flex; height: 48px; min-height: 48px; flex: 0 0 48px; align-items: center; justify-content: center; color: #fff; font-weight: 750; background: rgba(43, 45, 51, 0.96); border: 1px solid var(--color-line); }
</style>
