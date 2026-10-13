<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { AudioStorageError, useAppStore } from "@/stores/app-v2";

const props = defineProps<{ danceId: string }>();
const store = useAppStore();
const fileInput = ref<HTMLInputElement | null>(null);
const loading = ref(false);
const playingId = ref("");
const editingId = ref("");
const editingName = ref("");
let audio: HTMLAudioElement | null = null;

const tracks = computed(() => store.tracksForDance(props.danceId));
const formatSize = (bytes: number) => bytes >= 1024 * 1024
  ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
  : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const formatDuration = (seconds: number | null) => {
  if (!seconds || !Number.isFinite(seconds)) return "";
  const minute = Math.floor(seconds / 60);
  const second = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${minute}:${second}`;
};

const chooseFiles = () => {
  // #ifdef H5
  fileInput.value?.click();
  // #endif
  // #ifndef H5
  uni.showToast({ title: "当前版本请在手机网页中上传 MP3", icon: "none" });
  // #endif
};

const readDuration = (file: File) => new Promise<number | null>((resolve) => {
  const url = URL.createObjectURL(file);
  const element = new Audio();
  const finish = (value: number | null) => {
    URL.revokeObjectURL(url);
    resolve(value);
  };
  element.preload = "metadata";
  element.onloadedmetadata = () => finish(Number.isFinite(element.duration) ? element.duration : null);
  element.onerror = () => finish(null);
  element.src = url;
});

const uploadFiles = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files ?? []);
  target.value = "";
  if (!files.length) return;
  if (files.some((file) => file.type && file.type !== "audio/mpeg" && !file.name.toLowerCase().endsWith(".mp3"))) {
    uni.showToast({ title: "仅支持 MP3 文件", icon: "none" });
    return;
  }
  loading.value = true;
  try {
    const inputs = await Promise.all(files.map(async (file) => ({
      blob: file,
      name: file.name.replace(/\.mp3$/i, ""),
      mimeType: file.type || "audio/mpeg",
      duration: await readDuration(file),
    })));
    await store.addAudioTracks(props.danceId, inputs);
    uni.showToast({ title: `已保存 ${files.length} 个 MP3`, icon: "none" });
  } catch (error) {
    const title = error instanceof AudioStorageError
      ? ({
        "file-too-large": "单个 MP3 不能超过 100MB",
        "total-too-large": "音乐总空间已达到 1GB",
        "storage-full": "手机可用存储空间不足",
        "invalid-audio": "MP3 文件无法读取",
      }[error.code])
      : "音乐保存失败，请再试一次";
    uni.showToast({ title, icon: "none" });
  } finally {
    loading.value = false;
  }
};

const stop = () => {
  audio?.pause();
  audio = null;
  playingId.value = "";
};

const togglePlay = (trackId: string, assetId: string) => {
  if (playingId.value === trackId) {
    stop();
    return;
  }
  stop();
  const url = store.audioUrl(assetId);
  if (!url) {
    uni.showToast({ title: "音乐文件暂时不可用", icon: "none" });
    return;
  }
  audio = new Audio(url);
  audio.onended = stop;
  audio.onerror = () => {
    stop();
    uni.showToast({ title: "音乐播放失败", icon: "none" });
  };
  void audio.play().then(() => { playingId.value = trackId; }).catch(() => {
    stop();
    uni.showToast({ title: "请再次点击播放", icon: "none" });
  });
};

const startRename = (id: string, name: string) => {
  editingId.value = id;
  editingName.value = name;
};
const saveRename = () => {
  if (!editingName.value.trim()) return;
  store.renameAudioTrack(editingId.value, editingName.value);
  editingId.value = "";
};
const remove = (id: string, name: string) => {
  uni.showModal({
    title: `删除 ${name}？`,
    content: "音乐文件删除后无法找回。",
    confirmText: "删除",
    confirmColor: "#FFFFFF",
    success: async ({ confirm }) => {
      if (!confirm) return;
      if (playingId.value === id) stop();
      await store.deleteAudioTrack(id);
    },
  });
};

onBeforeUnmount(stop);
</script>

<template>
  <view class="audio-tracks">
    <view class="audio-tracks__heading">
      <view>
        <text>练舞音乐</text>
        <text>MP3 · 单文件最大 100MB</text>
      </view>
      <button :disabled="loading" aria-label="上传 MP3" @tap="chooseFiles">{{ loading ? "…" : "＋" }}</button>
    </view>

    <!-- #ifdef H5 -->
    <input ref="fileInput" class="audio-tracks__file" type="file" accept=".mp3,audio/mpeg" multiple @change="uploadFiles" />
    <!-- #endif -->

    <view v-if="tracks.length" class="audio-tracks__list">
      <view v-for="track in tracks" :key="track.id" class="audio-row">
        <button class="audio-row__play" :aria-label="playingId === track.id ? '暂停' : '播放'" @tap="togglePlay(track.id, track.assetId)">
          {{ playingId === track.id ? "■" : "▶" }}
        </button>
        <view v-if="editingId === track.id" class="audio-row__edit">
          <input v-model="editingName" maxlength="60" @confirm="saveRename" />
          <button aria-label="保存名称" @tap="saveRename">✓</button>
        </view>
        <view v-else class="audio-row__copy">
          <text>{{ track.displayName }}</text>
          <text>{{ formatDuration(track.duration) }}{{ track.duration ? " · " : "" }}{{ formatSize(track.fileSize) }}</text>
        </view>
        <button class="audio-row__icon" aria-label="修改音乐名称" @tap="startRename(track.id, track.displayName)">✎</button>
        <button class="audio-row__icon" aria-label="删除音乐" @tap="remove(track.id, track.displayName)">⌫</button>
      </view>
    </view>
    <button v-else class="audio-tracks__empty" @tap="chooseFiles">＋ 上传这支舞的 MP3</button>
  </view>
</template>

<style scoped lang="scss">
.audio-tracks { display: flex; flex-direction: column; gap: 8px; padding-top: 12px; border-top: 1px solid var(--color-line); }
.audio-tracks__heading { display: flex; align-items: center; justify-content: space-between; }
.audio-tracks__heading > view { display: flex; flex-direction: column; gap: 3px; }
.audio-tracks__heading > view text:first-child { font-size: 13px; font-weight: 750; }
.audio-tracks__heading > view text:last-child { color: var(--color-muted); font-size: 10px; }
.audio-tracks__heading > button { display: grid; width: 32px; height: 32px; color: #fff; font-size: 20px; background: var(--glass-strong); border: 1px solid var(--color-line); place-items: center; }
.audio-tracks__file { position: fixed; top: -10000px; left: -10000px; width: 1px; height: 1px; opacity: 0; }
.audio-tracks__list { display: flex; flex-direction: column; gap: 6px; }
.audio-row { display: flex; min-height: 48px; align-items: center; gap: 7px; padding: 6px 7px; background: var(--glass); border: 1px solid var(--color-line); }
.audio-row__play { display: grid; flex: 0 0 32px; width: 32px; height: 32px; color: #fff; font-size: 11px; background: var(--glass-strong); border: 1px solid var(--color-line); place-items: center; }
.audio-row__copy { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
.audio-row__copy text:first-child { overflow: hidden; font-size: 12px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.audio-row__copy text:last-child { color: var(--color-muted); font-size: 9px; }
.audio-row__edit { display: flex; flex: 1; gap: 5px; min-width: 0; }
.audio-row__edit input { flex: 1; height: 32px; padding: 0 8px; color: #fff; font-size: 11px; background: rgba(0, 0, 0, 0.18); border: 1px solid var(--color-line); }
.audio-row__edit button, .audio-row__icon { display: grid; flex: 0 0 30px; width: 30px; height: 30px; color: #fff; font-size: 13px; background: transparent; border: 1px solid var(--color-line); place-items: center; }
.audio-tracks__empty { display: flex; height: 42px; align-items: center; justify-content: center; color: var(--color-muted); font-size: 11px; background: var(--glass); border: 1px dashed var(--color-line); }
</style>
