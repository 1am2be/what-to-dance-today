<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, ref, watch } from "vue";

const props = defineProps<{
  open: boolean;
  source: string;
}>();

const emit = defineEmits<{
  close: [];
  replace: [];
  confirm: [imageUrl: string];
}>();

const OUTPUT_SIZE = 600;
const MIN_CROP_SIZE = 220;
const MAX_CROP_SIZE = 320;
const canvasId = "artist-image-crop-canvas";
const instance = getCurrentInstance();

const cropSize = ref(280);
const naturalWidth = ref(1);
const naturalHeight = ref(1);
const baseWidth = ref(1);
const baseHeight = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);
const scale = ref(1);
const workingSource = ref("");
const imageReady = ref(false);
const exporting = ref(false);

let gestureMode: "drag" | "pinch" | null = null;
let lastPoint = { x: 0, y: 0 };
let pinchStartDistance = 0;
let pinchStartScale = 1;

const imageStyle = computed(() => ({
  width: `${baseWidth.value}px`,
  height: `${baseHeight.value}px`,
  left: `${cropSize.value / 2 - baseWidth.value / 2 + offsetX.value}px`,
  top: `${cropSize.value / 2 - baseHeight.value / 2 + offsetY.value}px`,
  transform: `scale(${scale.value}) translateZ(0)`,
}));

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

const clampOffsets = () => {
  const maxX = Math.max(0, (baseWidth.value * scale.value - cropSize.value) / 2);
  const maxY = Math.max(0, (baseHeight.value * scale.value - cropSize.value) / 2);
  offsetX.value = clamp(offsetX.value, -maxX, maxX);
  offsetY.value = clamp(offsetY.value, -maxY, maxY);
};

const resetCrop = () => {
  offsetX.value = 0;
  offsetY.value = 0;
  scale.value = 1;
};

const getImageInfo = (src: string) => new Promise<UniNamespace.GetImageInfoSuccessData>((resolve, reject) => {
  uni.getImageInfo({ src, success: resolve, fail: reject });
});

const initializeCrop = async () => {
  imageReady.value = false;
  exporting.value = false;
  await nextTick();
  const system = uni.getSystemInfoSync();
  const availableHeight = Math.max(MIN_CROP_SIZE, Number(system.windowHeight || 700) - 300);
  cropSize.value = Math.max(
    MIN_CROP_SIZE,
    Math.min(MAX_CROP_SIZE, Number(system.windowWidth || 390) - 48, availableHeight),
  );

  try {
    const info = await getImageInfo(props.source);
    workingSource.value = info.path || props.source;
    naturalWidth.value = Math.max(1, info.width);
    naturalHeight.value = Math.max(1, info.height);
    const aspect = naturalWidth.value / naturalHeight.value;
    if (aspect >= 1) {
      baseHeight.value = cropSize.value;
      baseWidth.value = cropSize.value * aspect;
    } else {
      baseWidth.value = cropSize.value;
      baseHeight.value = cropSize.value / aspect;
    }
    resetCrop();
    imageReady.value = true;
  } catch {
    uni.showToast({ title: "图片读取失败，请重新选择", icon: "none" });
    emit("replace");
  }
};

watch(
  () => [props.open, props.source] as const,
  ([open, source]) => {
    if (open && source) void initializeCrop();
  },
  { immediate: true },
);

const pointFromTouch = (touch: Touch) => ({
  x: Number(touch.clientX ?? touch.pageX ?? 0),
  y: Number(touch.clientY ?? touch.pageY ?? 0),
});

const touchPoints = (event: TouchEvent) => Array.from(event.touches ?? []).map(pointFromTouch);

const distanceBetween = (left: { x: number; y: number }, right: { x: number; y: number }) =>
  Math.hypot(right.x - left.x, right.y - left.y);

const beginGesture = (event: TouchEvent) => {
  const points = touchPoints(event);
  if (points.length >= 2) {
    gestureMode = "pinch";
    pinchStartDistance = Math.max(1, distanceBetween(points[0], points[1]));
    pinchStartScale = scale.value;
    return;
  }
  if (points.length === 1) {
    gestureMode = "drag";
    lastPoint = points[0];
  }
};

const moveGesture = (event: TouchEvent) => {
  const points = touchPoints(event);
  if (points.length >= 2) {
    if (gestureMode !== "pinch") beginGesture(event);
    const nextDistance = Math.max(1, distanceBetween(points[0], points[1]));
    scale.value = clamp(pinchStartScale * (nextDistance / pinchStartDistance), 1, 4);
    clampOffsets();
    return;
  }
  if (points.length === 1) {
    if (gestureMode !== "drag") {
      gestureMode = "drag";
      lastPoint = points[0];
      return;
    }
    offsetX.value += points[0].x - lastPoint.x;
    offsetY.value += points[0].y - lastPoint.y;
    lastPoint = points[0];
    clampOffsets();
  }
};

const endGesture = (event: TouchEvent) => {
  const points = touchPoints(event);
  if (points.length === 1) {
    gestureMode = "drag";
    lastPoint = points[0];
  } else {
    gestureMode = null;
  }
};

const changeZoom = (event: { detail: { value: number | string } }) => {
  scale.value = clamp(Number(event.detail.value) / 100, 1, 4);
  clampOffsets();
};

const cropCoordinates = () => {
  const displayedWidth = baseWidth.value * scale.value;
  const displayedHeight = baseHeight.value * scale.value;
  const imageLeft = cropSize.value / 2 + offsetX.value - displayedWidth / 2;
  const imageTop = cropSize.value / 2 + offsetY.value - displayedHeight / 2;
  const sourceWidth = cropSize.value / displayedWidth * naturalWidth.value;
  const sourceHeight = cropSize.value / displayedHeight * naturalHeight.value;
  return {
    x: clamp(-imageLeft / displayedWidth * naturalWidth.value, 0, naturalWidth.value - sourceWidth),
    y: clamp(-imageTop / displayedHeight * naturalHeight.value, 0, naturalHeight.value - sourceHeight),
    width: sourceWidth,
    height: sourceHeight,
  };
};

const exportForH5 = async () => {
  // #ifdef H5
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = workingSource.value;
  });
  const crop = cropCoordinates();
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas-context");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );
  return canvas.toDataURL("image/jpeg", 0.88);
  // #endif
  return "";
};

const exportForMiniProgram = async () => {
  // #ifndef H5
  const crop = cropCoordinates();
  const context = uni.createCanvasContext(canvasId, instance?.proxy);
  context.drawImage(
    workingSource.value,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );
  await new Promise<void>((resolve) => context.draw(false, resolve));
  const temporaryPath = await new Promise<string>((resolve, reject) => {
    uni.canvasToTempFilePath({
      canvasId,
      width: OUTPUT_SIZE,
      height: OUTPUT_SIZE,
      destWidth: OUTPUT_SIZE,
      destHeight: OUTPUT_SIZE,
      fileType: "jpg",
      quality: 0.88,
      success: ({ tempFilePath }) => resolve(tempFilePath),
      fail: reject,
    }, instance?.proxy);
  });
  return await new Promise<string>((resolve) => {
    uni.saveFile({
      tempFilePath: temporaryPath,
      success: ({ savedFilePath }) => resolve(savedFilePath),
      fail: () => resolve(temporaryPath),
    });
  });
  // #endif
  return "";
};

const confirmCrop = async () => {
  if (!imageReady.value || exporting.value) return;
  exporting.value = true;
  try {
    let result = "";
    // #ifdef H5
    result = await exportForH5();
    // #endif
    // #ifndef H5
    result = await exportForMiniProgram();
    // #endif
    if (!result) throw new Error("empty-crop");
    emit("confirm", result);
  } catch {
    uni.showToast({ title: "图片裁剪失败，请再试一次", icon: "none" });
  } finally {
    exporting.value = false;
  }
};
</script>

<template>
  <view v-if="open" class="crop-layer">
    <button class="crop-layer__backdrop" aria-label="取消裁剪" @tap="$emit('close')" />
    <view class="crop-panel" @tap.stop>
      <view class="crop-panel__header">
        <view>
          <text class="crop-panel__title">调整图片</text>
          <text class="crop-panel__subtitle">拖动图片，双指或滑杆缩放</text>
        </view>
        <button class="crop-panel__close" aria-label="关闭" @tap="$emit('close')">×</button>
      </view>

      <view
        class="crop-stage"
        :style="{ width: `${cropSize}px`, height: `${cropSize}px` }"
        @touchstart.stop="beginGesture"
        @touchmove.stop.prevent="moveGesture"
        @touchend.stop="endGesture"
        @touchcancel.stop="endGesture"
      >
        <image
          v-if="imageReady"
          class="crop-stage__image"
          :src="workingSource"
          :style="imageStyle"
          mode="scaleToFill"
          draggable="false"
        />
        <view v-else class="crop-stage__loading">正在读取图片…</view>
        <view class="crop-stage__grid crop-stage__grid--vertical" />
        <view class="crop-stage__grid crop-stage__grid--horizontal" />
      </view>

      <view class="crop-zoom">
        <text>缩小</text>
        <slider
          class="crop-zoom__slider"
          :value="Math.round(scale * 100)"
          :min="100"
          :max="400"
          :step="1"
          active-color="#7ED9E7"
          background-color="#E5EBEF"
          block-color="#EC6F9E"
          :block-size="18"
          @changing="changeZoom"
          @change="changeZoom"
        />
        <text>放大</text>
      </view>

      <view class="crop-tools">
        <button @tap="$emit('replace')">重新选择</button>
        <button @tap="resetCrop">重置位置</button>
      </view>
      <button class="crop-confirm" :disabled="!imageReady || exporting" @tap="confirmCrop">
        {{ exporting ? "正在保存…" : "确认使用" }}
      </button>

      <canvas
        :canvas-id="canvasId"
        :id="canvasId"
        class="crop-output-canvas"
        :width="OUTPUT_SIZE"
        :height="OUTPUT_SIZE"
      />
    </view>
  </view>
</template>

<style scoped lang="scss">
.crop-layer {
  position: fixed;
  z-index: 90;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(12px + env(safe-area-inset-top)) 12px calc(12px + env(safe-area-inset-bottom));
}

.crop-layer__backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: rgba(18, 25, 35, 0.72);
}

.crop-panel {
  position: relative;
  display: flex;
  width: min(100%, 390px);
  max-height: 100%;
  flex-direction: column;
  align-items: center;
  padding: 20px 18px 18px;
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 28px;
  box-shadow: 0 22px 54px rgba(10, 25, 34, 0.28);
}

.crop-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 16px;
}

.crop-panel__header > view {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.crop-panel__title {
  color: var(--color-ink);
  font-size: 22px;
  font-weight: 800;
}

.crop-panel__subtitle {
  color: var(--color-muted);
  font-size: 12px;
}

.crop-panel__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin: 0;
  color: #ffffff;
  font-size: 22px;
  font-weight: 500;
  line-height: 1;
  background: var(--color-pink-strong);
  border-radius: 50%;
  box-shadow: 0 5px 12px rgba(236, 111, 158, 0.26);
}

.crop-stage {
  position: relative;
  flex: 0 0 auto;
  overflow: hidden;
  touch-action: none;
  background: #1b222b;
  border: 3px solid #ffffff;
  border-radius: 18px;
  box-shadow:
    0 0 0 2px var(--color-aqua),
    0 12px 26px rgba(35, 55, 67, 0.18);
}

.crop-stage__image {
  position: absolute;
  display: block;
  max-width: none;
  transform-origin: center center;
  backface-visibility: hidden;
  will-change: transform, left, top;
}

.crop-stage__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 13px;
}

.crop-stage__grid {
  position: absolute;
  z-index: 2;
  pointer-events: none;
  opacity: 0.5;
}

.crop-stage__grid--vertical {
  top: 0;
  bottom: 0;
  left: 33.333%;
  width: 33.333%;
  border-right: 1px solid rgba(255, 255, 255, 0.72);
  border-left: 1px solid rgba(255, 255, 255, 0.72);
}

.crop-stage__grid--horizontal {
  top: 33.333%;
  right: 0;
  left: 0;
  height: 33.333%;
  border-top: 1px solid rgba(255, 255, 255, 0.72);
  border-bottom: 1px solid rgba(255, 255, 255, 0.72);
}

.crop-zoom {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  width: 100%;
  gap: 7px;
  margin-top: 13px;
  color: var(--color-muted);
  font-size: 11px;
}

.crop-zoom__slider {
  width: 100%;
  margin: 0;
}

.crop-tools {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  gap: 10px;
  margin-top: 4px;
}

.crop-tools button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 650;
  background: #f1f5f7;
  border-radius: 12px;
}

.crop-confirm {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 46px;
  margin: 10px 0 0;
  color: #ffffff;
  font-size: 15px;
  font-weight: 750;
  background: var(--color-aqua);
  border-radius: 15px;
}

.crop-confirm[disabled] {
  opacity: 0.55;
}

.crop-output-canvas {
  position: fixed;
  top: -10000px;
  left: -10000px;
  width: 600px;
  height: 600px;
  pointer-events: none;
  opacity: 0;
}
</style>
