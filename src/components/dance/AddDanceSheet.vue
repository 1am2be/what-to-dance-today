<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import BottomSheet from "@/components/base/BottomSheet.vue";
import ImageCropSheet from "@/components/base/ImageCropSheet.vue";
import type { Artist } from "@/domain/models/artist";
import type { DanceSource, ScopeType } from "@/domain/models/dance";
import { DanceValidationError, useAppStore } from "@/stores/app";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; saved: [] }>();
const store = useAppStore();

const todayText = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

const sourceType = ref<DanceSource>("new");
const useNewArtist = ref(false);
const error = ref("");
const cropOpen = ref(false);
const cropSource = ref("");
const form = reactive({
  artistId: "",
  artistName: "",
  artistImageUrl: "",
  songTitle: "",
  scopeType: "chorus" as ScopeType,
  customScope: "",
  learnedDate: todayText(),
});

const scopeOptions: Array<{ value: ScopeType; label: string }> = [
  { value: "full", label: "全曲" },
  { value: "half", label: "半曲" },
  { value: "chorus", label: "副歌" },
  { value: "custom", label: "自定义" },
];

const selectedArtist = computed(() => store.artists.find((artist) => artist.id === form.artistId));
const scopeText = computed(() => scopeOptions.find((item) => item.value === form.scopeType)?.label ?? "");

const reset = () => {
  sourceType.value = "new";
  useNewArtist.value = false;
  error.value = "";
  form.artistId = store.artists[0]?.id ?? "";
  form.artistName = "";
  form.artistImageUrl = "";
  form.songTitle = "";
  form.scopeType = "chorus";
  form.customScope = "";
  form.learnedDate = todayText();
  cropOpen.value = false;
  cropSource.value = "";
};

watch(() => props.open, (open) => {
  if (open) reset();
});

const selectArtist = (event: { detail: { value: number } }) => {
  form.artistId = store.artists[Number(event.detail.value)]?.id ?? "";
};

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ["original"],
    sourceType: ["album", "camera"],
    success: (result) => {
      const paths = Array.isArray(result.tempFilePaths) ? result.tempFilePaths : [result.tempFilePaths];
      const path = paths[0];
      if (!path) return;
      cropSource.value = path;
      cropOpen.value = true;
    },
  });
};

const replaceCropImage = () => {
  cropOpen.value = false;
  chooseImage();
};

const applyCroppedImage = (imageUrl: string) => {
  form.artistImageUrl = imageUrl;
  cropOpen.value = false;
  cropSource.value = "";
  error.value = "";
};

const messageFor = (validationError: DanceValidationError) => ({
  "artist-name": "请输入 Artist Name",
  "artist-image": "请上传 Artist 图片",
  "song-title": "请输入歌名",
  scope: "请填写具体学习范围",
  "future-date": "学习日期不能晚于今天",
  "duplicate-unchanged": "学习内容没有变化，未新增练习记录",
}[validationError.code]);

const submit = () => {
  error.value = "";
  try {
    const result = store.addDance({
      artistId: useNewArtist.value ? undefined : form.artistId,
      artistName: useNewArtist.value ? form.artistName : selectedArtist.value?.name ?? "",
      artistImageUrl: form.artistImageUrl,
      songTitle: form.songTitle,
      scopeType: form.scopeType,
      scopeText: form.scopeType === "custom" ? form.customScope : scopeText.value,
      sourceType: sourceType.value,
      learnedDate: sourceType.value === "new" ? form.learnedDate : undefined,
    });
    const title = result === "scope-updated"
      ? "范围已更新 · 已记为新的学习"
      : sourceType.value === "new"
        ? "已加入舞单 · 明天开始第一次复习 ✦"
        : "已加入已掌握舞单";
    uni.showToast({ title, icon: "none" });
    emit("saved");
    emit("close");
  } catch (caught) {
    error.value = caught instanceof DanceValidationError ? messageFor(caught) : "保存失败，请再试一次";
  }
};
</script>

<template>
  <view>
    <BottomSheet :open="open" @close="$emit('close')">
      <view class="add-sheet">
      <text class="sheet-title">添加舞蹈</text>

      <view class="tabs">
        <button :class="{ active: sourceType === 'new' }" @tap="sourceType = 'new'">新学的</button>
        <button :class="{ active: sourceType === 'old' }" @tap="sourceType = 'old'">以前学过</button>
      </view>

      <view class="field">
        <view class="field__heading">
          <text>Artist</text>
          <button class="field__switch" @tap="useNewArtist = !useNewArtist">
            {{ useNewArtist ? "选择已有" : "＋ 新增 Artist" }}
          </button>
        </view>
        <template v-if="useNewArtist">
          <input v-model="form.artistName" class="input input--left" placeholder="Artist Name" />
          <button
            class="image-upload"
            :class="{ 'image-upload--filled': form.artistImageUrl }"
            @tap="chooseImage"
          >
            <image v-if="form.artistImageUrl" :src="form.artistImageUrl" mode="aspectFill" />
            <text v-else class="image-upload__label">＋ 上传 Artist 图片</text>
          </button>
        </template>
        <picker v-else mode="selector" :range="store.artists" range-key="name" @change="selectArtist">
          <view class="input input--picker input--left">{{ selectedArtist?.name || "选择 Artist" }} <text>⌄</text></view>
        </picker>
      </view>

      <view class="field">
        <text>Song Title</text>
        <input v-model="form.songTitle" class="input input--left" placeholder="输入歌名" />
      </view>

      <view class="field">
        <text>学习范围</text>
        <view class="scope-options">
          <button
            v-for="option in scopeOptions"
            :key="option.value"
            :class="{ active: form.scopeType === option.value }"
            @tap="form.scopeType = option.value"
          >{{ option.label }}</button>
        </view>
        <input v-if="form.scopeType === 'custom'" v-model="form.customScope" class="input" placeholder="例如 00:48–01:26" />
      </view>

      <view v-if="sourceType === 'new'" class="field">
        <text>学习日期</text>
        <picker mode="date" :value="form.learnedDate" :end="todayText()" @change="form.learnedDate = $event.detail.value">
          <view class="input input--picker input--left">{{ form.learnedDate }} <text>⌄</text></view>
        </picker>
      </view>

      <text v-if="error" class="form-error">{{ error }}</text>
      <button class="primary-button" @tap="submit">＋ {{ sourceType === "new" ? "记录学习" : "加入我的舞单" }}</button>
      </view>
    </BottomSheet>
    <ImageCropSheet
      :open="cropOpen"
      :source="cropSource"
      @close="cropOpen = false"
      @replace="replaceCropImage"
      @confirm="applyCroppedImage"
    />
  </view>
</template>

<style scoped lang="scss">
.add-sheet { display: flex; flex-direction: column; gap: 16px; }
.sheet-title { font-size: 24px; font-weight: 800; }
.tabs { display: grid; grid-template-columns: 1fr 1fr; padding: 5px; background: #d7f7fb; border-radius: 999px; }
.tabs button { display: flex; align-items: center; justify-content: center; height: 40px; padding: 0 12px; color: var(--color-muted); font-weight: 650; border-radius: 999px; }
.tabs .active { color: var(--color-ink); background: #fff; }
.field { display: flex; flex-direction: column; gap: 8px; color: var(--color-muted); font-size: 14px; }
.field__heading { display: flex; align-items: center; justify-content: flex-start; gap: 6px; }
.field__switch { display: flex; align-items: center; justify-content: center; height: 26px; padding: 0 9px; color: var(--color-aqua-strong); font-size: 12px; background: #f1f4f5; border-radius: 8px; }
.input { width: 100%; height: 48px; padding: 0 16px; color: var(--color-ink); font-size: 16px; text-align: center; border: 1px solid var(--color-line); border-radius: 14px; }
.input--picker { position: relative; display: flex; align-items: center; justify-content: center; }
.input--picker text { position: absolute; right: 16px; }
.input--left { justify-content: flex-start; text-align: left; }
.image-upload { display: grid; width: 124px; height: 124px; overflow: hidden; isolation: isolate; place-items: center; padding: 12px; color: var(--color-aqua-strong); text-align: center; background: #eefbfc; border: 1px dashed var(--color-aqua); border-radius: 14px; transform: translateZ(0); backface-visibility: hidden; }
.image-upload--filled { padding: 0; border-style: solid; }
.image-upload__label { width: 76px; font-size: 11px; line-height: 1.15; text-align: center; }
.image-upload image { display: block; width: 100%; height: 100%; image-rendering: auto; transform: translateZ(0) scale(1.01); backface-visibility: hidden; }
.scope-options { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; }
.scope-options button { display: flex; align-items: center; justify-content: center; height: 38px; padding: 0 10px; color: var(--color-muted); font-size: 12px; white-space: nowrap; background: #f3f6f8; border-radius: 10px; }
.scope-options .active { color: #0e899f; background: #d7f7fb; }
.form-error { color: var(--color-pink-strong); font-size: 13px; }
.primary-button { display: flex; align-items: center; justify-content: center; height: 52px; padding: 0 20px; color: #ffffff; font-size: 17px; font-weight: 700; background: var(--color-aqua); border-radius: 999px; }
</style>
