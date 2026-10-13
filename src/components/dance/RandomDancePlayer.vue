<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useAppStore } from "@/stores/app-v2";

const props = defineProps<{ open: boolean }>();
const store = useAppStore();
const playing = ref(false);
const loading = ref(false);
const currentTrackId = ref("");
let audio: HTMLAudioElement | null = null;
let queue: string[] = [];
let lastDanceId = "";
let generation = 0;
let playbackRequested = false;

const availableDances = computed(() => store.dances.filter((dance) =>
  store.tracksForDance(dance.id).some((track) => Boolean(store.audioUrl(track.assetId)))));

const shuffle = (ids: string[]) => {
  const result = [...ids];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  if (result.length > 1 && result[0] === lastDanceId) {
    [result[0], result[1]] = [result[1], result[0]];
  }
  return result;
};

const pause = () => {
  playbackRequested = false;
  generation += 1;
  audio?.pause();
  playing.value = false;
  loading.value = false;
};

const getAudio = () => {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = "auto";
  audio.onplaying = () => {
    if (!props.open || !playbackRequested) { audio?.pause(); return; }
    playing.value = true;
    loading.value = false;
  };
  audio.onpause = () => { playing.value = false; };
  audio.onerror = () => { playing.value = false; loading.value = false; };
  audio.onended = () => {
    playing.value = false;
    if (props.open) void playNext();
  };
  return audio;
};

const playNext = async () => {
  if (!props.open) return;
  const dances = availableDances.value;
  if (!dances.length) {
    pause();
    currentTrackId.value = "";
    uni.showToast({ title: "先为舞蹈上传音频吧", icon: "none" });
    return;
  }
  const validIds = new Set(dances.map((dance) => dance.id));
  queue = queue.filter((id) => validIds.has(id));
  if (!queue.length) queue = shuffle([...validIds]);
  const danceId = queue.shift()!;
  const tracks = store.tracksForDance(danceId).filter((track) => store.audioUrl(track.assetId));
  const track = tracks[Math.floor(Math.random() * tracks.length)];
  const element = getAudio();
  lastDanceId = danceId;
  currentTrackId.value = track.id;
  const request = ++generation;
  playbackRequested = true;
  loading.value = true;
  // Reuse the element activated by the initial tap for automatic next-track playback.
  element.src = store.audioUrl(track.assetId);
  try {
    await element.play();
    if (request !== generation || !props.open) return;
    playing.value = true;
  } catch {
    if (request !== generation) return;
    playing.value = false;
    uni.showToast({ title: "音乐暂时无法播放，请点击重试", icon: "none" });
  } finally {
    if (request === generation) loading.value = false;
  }
};

const toggle = async () => {
  if (playing.value || loading.value) { pause(); return; }
  if (typeof Audio === "undefined") {
    uni.showToast({ title: "请在网页版本中播放音乐", icon: "none" });
    return;
  }
  const track = store.audioTracks.find((item) => item.id === currentTrackId.value);
  if (!audio || audio.ended || !track || !store.audioUrl(track.assetId)) {
    await playNext();
    return;
  }
  const request = ++generation;
  playbackRequested = true;
  loading.value = true;
  try {
    await audio.play();
    if (request === generation && props.open) playing.value = true;
  } catch {
    if (request === generation) uni.showToast({ title: "音乐暂时无法播放，请点击重试", icon: "none" });
  } finally {
    if (request === generation) loading.value = false;
  }
};

watch(() => props.open, (open) => { if (!open) pause(); });
onBeforeUnmount(() => {
  pause();
  if (audio) {
    audio.onended = null;
    audio.onplaying = null;
    audio.onpause = null;
    audio.onerror = null;
    audio.removeAttribute("src");
    audio.load();
    audio = null;
  }
});
</script>

<template>
  <button class="random-player" :aria-label="playing || loading ? '暂停随机舞蹈' : '播放随机舞蹈'" :aria-pressed="playing" @tap="toggle">
    <view class="random-player__icon" :class="{ 'random-player__icon--pause': playing || loading }" aria-hidden="true">
      <view v-if="playing || loading" /><view v-if="playing || loading" />
    </view>
    <text>随机舞蹈</text>
  </button>
</template>

<style scoped lang="scss">
.random-player { display: flex; flex: 0 0 auto; height: 32px; align-items: center; justify-content: center; gap: 6px; padding: 0 10px; color: #fff; font-size: 11px; line-height: 1; background: var(--glass); border: 1px solid var(--color-line); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); }
.random-player__icon { width: 0; height: 0; border-top: 5px solid transparent; border-bottom: 5px solid transparent; border-left: 8px solid #fff; }
.random-player__icon--pause { display: flex; width: 8px; height: 10px; justify-content: space-between; border: 0; }
.random-player__icon--pause > view { width: 3px; height: 10px; background: #fff; }
</style>
