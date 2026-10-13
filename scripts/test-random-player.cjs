// Exercises the Vue component's script against a controllable audio device.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { ref, computed } = require('vue');

const source = fs.readFileSync('src/components/dance/RandomDancePlayer.vue', 'utf8')
  .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  .replace(/^import .*;\r?\n/gm, '');

function fixture(dances, tracks) {
  let onOpen, dispose;
  const notices = [];
  const elements = [];
  const props = { open: true };
  const store = {
    dances, audioTracks: tracks,
    tracksForDance: (id) => tracks.filter((track) => track.danceId === id),
    audioUrl: (id) => id ? `blob:${id}` : '',
  };
  class FakeAudio {
    constructor() { this.ended = false; this.currentTime = 0; this.src = ''; elements.push(this); }
    play() { this.ended = false; this.onplaying?.(); return Promise.resolve(); }
    pause() { this.onpause?.(); }
    removeAttribute() { this.src = ''; }
    load() {}
    finish() { this.ended = true; this.onended?.(); }
  }
  const context = {
    ref, computed, defineProps: () => props, useAppStore: () => store,
    watch: (_, callback) => { onOpen = callback; },
    onBeforeUnmount: (callback) => { dispose = callback; },
    Audio: FakeAudio, uni: { showToast: (value) => notices.push(value.title) },
  };
  const compiled = ts.transpile(source + '\nglobalThis.api = { toggle, playing, loading, currentTrackId };', {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None,
  });
  vm.runInNewContext(compiled, context);
  return { ...context.api, props, notices, elements, close: () => { props.open = false; onOpen(false); }, dispose: () => dispose() };
}

(async () => {
  const empty = fixture([], []);
  await empty.toggle();
  assert.equal(empty.playing.value, false);
  assert.equal(empty.notices[0], '先为舞蹈上传音频吧');

  const tracks = [
    { id: 'a-slow', danceId: 'a', assetId: 'a-slow' },
    { id: 'a-normal', danceId: 'a', assetId: 'a-normal' },
    { id: 'b', danceId: 'b', assetId: 'b' },
    { id: 'c', danceId: 'c', assetId: 'c' },
  ];
  const player = fixture([{ id: 'a' }, { id: 'b' }, { id: 'c' }], tracks);
  await player.toggle();
  assert.equal(player.playing.value, true);
  const element = player.elements[0];
  element.currentTime = 12;
  const firstId = player.currentTrackId.value;
  await player.toggle();
  assert.equal(player.playing.value, false);
  await player.toggle();
  assert.equal(player.playing.value, true);
  assert.equal(player.currentTrackId.value, firstId);
  assert.equal(element.currentTime, 12);

  const selected = [];
  for (let index = 0; index < 12; index += 1) {
    selected.push(tracks.find((track) => track.id === player.currentTrackId.value).danceId);
    element.finish();
    await Promise.resolve();
  }
  for (let start = 0; start < 12; start += 3) assert.equal(new Set(selected.slice(start, start + 3)).size, 3);
  for (let index = 1; index < selected.length; index += 1) assert.notEqual(selected[index], selected[index - 1]);
  assert.equal(player.elements.length, 1, 'automatic playback must reuse the activated audio element');
  player.close();
  assert.equal(player.playing.value, false);
  const closedId = player.currentTrackId.value;
  element.finish();
  await Promise.resolve();
  assert.equal(player.currentTrackId.value, closedId);
  player.dispose();
  assert.equal(element.src, '');
  console.log('PASS: empty library, pause/resume, continuous shuffled rounds, equal song weighting, no boundary repeats, close and cleanup');
})().catch((error) => { console.error(error); process.exitCode = 1; });
