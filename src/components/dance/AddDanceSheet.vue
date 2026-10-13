<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import BottomSheet from "@/components/base/BottomSheet.vue";
import ImageCropSheet from "@/components/base/ImageCropSheet.vue";
import type { Artist } from "@/domain/models/artist";
import type { DanceSource, ScopeType } from "@/domain/models/dance";
import { AudioStorageError, DanceValidationError, MAX_AUDIO_FILE_SIZE, useAppStore } from "@/stores/app-v2";

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
const audioInput = ref<HTMLInputElement | null>(null);
const stagedAudio = ref<File[]>([]);
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
  stagedAudio.value = [];
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
  "artist-duplicate": "已有同名 Artist",
  "song-title": "请输入歌名",
  scope: "请填写具体学习范围",
  "future-date": "学习日期不能晚于今天",
  "duplicate-unchanged": "学习内容没有变化，未新增练习记录",
}[validationError.code]);

const chooseAudio = () => {
  // #ifdef H5
  audioInput.value?.click();
  // #endif
  // #ifndef H5
  uni.showToast({ title: "当前版本请在手机网页中上传 MP3", icon: "none" });
  // #endif
};

const selectAudio = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  if (!files.length) return;
  if (files.some((file) => (!file.name.toLowerCase().endsWith(".mp3") && file.type !== "audio/mpeg"))) {
    uni.showToast({ title: "仅支持 MP3 文件", icon: "none" });
    return;
  }
  if (files.some((file) => file.size > MAX_AUDIO_FILE_SIZE)) {
    uni.showToast({ title: "单个 MP3 不能超过 100MB", icon: "none" });
    return;
  }
  stagedAudio.value = files;
};

const readDuration = (file: File) => new Promise<number | null>((resolve) => {
  const url = URL.createObjectURL(file);
  const element = new Audio();
  const finish = (duration: number | null) => {
    URL.revokeObjectURL(url);
    resolve(duration);
  };
  element.preload = "metadata";
  element.onloadedmetadata = () => finish(Number.isFinite(element.duration) ? element.duration : null);
  element.onerror = () => finish(null);
  element.src = url;
});

const submit = async () => {
  error.value = "";
  try {
    const result = await store.addDance({
      artistId: useNewArtist.value ? undefined : form.artistId,
      artistName: useNewArtist.value ? form.artistName : selectedArtist.value?.name ?? "",
      artistImageUrl: form.artistImageUrl,
      songTitle: form.songTitle,
      scopeType: form.scopeType,
      scopeText: form.scopeType === "custom" ? form.customScope : scopeText.value,
      sourceType: sourceType.value,
      learnedDate: sourceType.value === "new" ? form.learnedDate : undefined,
    });
    let audioSaved = true;
    if (stagedAudio.value.length) {
      try {
        const audioTracks = await Promise.all(stagedAudio.value.map(async (file) => ({
          blob: file,
          name: file.name.replace(/\.mp3$/i, ""),
          mimeType: file.type || "audio/mpeg",
          duration: await readDuration(file),
        })));
        await store.addAudioTracks(result.danceId, audioTracks);
      } catch (audioError) {
        audioSaved = false;
        if (audioError instanceof AudioStorageError) {
          console.warn("Audio storage failed", audioError.code);
        }
      }
    }
    const savedDance = store.dances.find((dance) => dance.id === result.danceId);
    const reviewAlreadyDue = Boolean(
      savedDance?.nextReviewAt && new Date(savedDance.nextReviewAt).getTime() <= Date.now(),
    );
    const title = !audioSaved
      ? "舞蹈已保存 · 音频未保存"
      : result.status === "scope-updated"
      ? "范围已更新 · 已记为新的学习"
      : sourceType.value === "new"
        ? reviewAlreadyDue
          ? "已加入舞单 · 现在已经可以复习啦"
          : "已加入舞单 · 明天开始第一次复习 ✦"
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
        </view>
        <button class="field__switch" @tap="useNewArtist = !useNewArtist">
          {{ useNewArtist ? "选择已有" : "＋ 新增 Artist" }}
        </button>
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
        <view class="field__heading">
          <text>Song Title</text>
          <button class="field__switch" @tap="chooseAudio">
            {{ stagedAudio.length ? `已选择 ${stagedAudio.length} 个音频` : "点击可上传音频" }}
          </button>
        </view>
        <!-- #ifdef H5 -->
        <input ref="audioInput" class="audio-file-input" type="file" accept=".mp3,audio/mpeg" multiple @change="selectAudio" />
        <!-- #endif -->
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
.tabs { display: grid; grid-template-columns: 1fr 1fr; padding: 4px; background: var(--glass); border: 1px solid var(--color-line); }
.tabs button { display: flex; height: 40px; align-items: center; justify-content: center; padding: 0 12px; color: var(--color-muted); font-weight: 650; line-height: 1; background: transparent; }
.tabs .active { color: #fff; background: var(--glass-strong); border: 1px solid var(--color-line); }
.field { display: flex; flex-direction: column; gap: 8px; color: var(--color-muted); font-size: 14px; }
.field__heading { display: flex; align-items: center; justify-content: flex-start; gap: 6px; }
.field__switch { display: flex; width: fit-content; height: 26px; flex: 0 0 auto; align-items: center; justify-content: center; margin: 0; padding: 0 9px; color: #fff; font-size: 12px; line-height: 1; background: var(--glass); border: 1px solid var(--color-line); }
.input { width: 100%; height: 48px; padding: 0 16px; color: #fff; font-size: 16px; text-align: center; background: var(--glass); border: 1px solid var(--color-line); }
.input--picker { position: relative; display: flex; align-items: center; justify-content: center; }
.input--picker text { position: absolute; right: 16px; }
.input--left { justify-content: flex-start; text-align: left; }
.image-upload { display: grid; width: 124px; height: 124px; overflow: hidden; isolation: isolate; place-items: center; padding: 12px; color: #fff; text-align: center; background: var(--glass); border: 1px dashed var(--color-line); transform: translateZ(0); backface-visibility: hidden; }
.image-upload--filled { padding: 0; border-style: solid; }
.image-upload__label { width: 76px; font-size: 11px; line-height: 1.15; text-align: center; }
.image-upload image { display: block; width: 100%; height: 100%; image-rendering: auto; transform: translateZ(0) scale(1.01); backface-visibility: hidden; }
.scope-options { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; }
.scope-options button { display: flex; height: 38px; align-items: center; justify-content: center; padding: 0 8px; color: var(--color-muted); font-size: 12px; white-space: nowrap; background: var(--glass); border: 1px solid var(--color-line); }
.scope-options .active { color: #fff; background: var(--glass-strong); }
.form-error { color: var(--color-pink-strong); font-size: 13px; }
.audio-file-input { position: fixed; top: -10000px; left: -10000px; width: 1px; height: 1px; opacity: 0; }
.primary-button { display: flex; height: 52px; align-items: center; justify-content: center; padding: 0 20px; color: #ffffff; font-size: 17px; font-weight: 700; background: var(--glass-strong); border: 1px solid var(--color-line); }
</style>
