import { defineComponent, h } from "vue";

// Render a native file input: uni-app's template <input> is a uni-input component.
export default defineComponent({
  props: { disabled: Boolean, hasTracks: Boolean, compact: Boolean, label: String },
  emits: { change: (_event: Event) => true },
  setup(props, { emit }) {
    return () => h("label", {
      style: {
        position: "relative", display: "flex", width: props.compact ? "auto" : "100%", height: props.compact ? "26px" : "42px",
        flexShrink: "0", padding: props.compact ? "0 9px" : "0",
        alignItems: "center", justifyContent: "center", overflow: "hidden",
        color: props.compact ? "#fff" : "var(--color-muted)", fontSize: props.compact ? "12px" : "11px", lineHeight: "1",
        background: "var(--glass)", border: `1px ${props.compact ? "solid" : "dashed"} var(--color-line)`,
        opacity: props.disabled ? "0.5" : "1",
      },
    }, [
      h("span", { "aria-hidden": "true" }, props.disabled ? "正在保存…" : props.label || (props.hasTracks ? "＋ 继续上传 MP3" : "＋ 上传这支舞的 MP3")),
      h("input", {
        type: "file", accept: ".mp3,audio/mpeg", multiple: true,
        disabled: props.disabled, "aria-label": "上传这支舞的 MP3",
        style: {
          position: "absolute", top: "0", left: "0", width: "100%", height: "100%",
          opacity: "0", cursor: "pointer", fontSize: "16px",
        },
        onChange: (event: Event) => emit("change", event),
      }),
    ]);
  },
});
