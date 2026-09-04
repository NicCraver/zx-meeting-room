import {
  defineConfig,
  transformerVariantGroup,
  presetTypography,
  presetIcons
} from "unocss";
import { presetWind3 } from "@unocss/preset-wind3";
import transformerDirectives from "@unocss/transformer-directives";

const fontSans =
  '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif';

export default defineConfig({
  presets: [
    presetWind3(),
    presetTypography(),
    presetIcons({ scale: 1.2, warn: true })
  ],
  theme: {
    fontFamily: {
      sans: fontSans
    },
    colors: {
      black: "#1F2329",
      ink: "#1F2329",
      body: "#5D616B",
      primary: "#3E7EFF",
      primaryActive: "#2E6BE6",
      primaryLight: "#EBF2FF",
      primaryBorder: "#D8E5FF",
      primaryBg: "#EBF2FF",
      primaryPressed: "#2E6BE6",
      onPrimary: "#FFFFFF",
      danger: "#FA4141",
      dangerActive: "#DD3636",
      dangerPressed: "#DD3636",
      success: "#36D18E",
      successLight: "#EAFAF3",
      "success-bg": "#EAFAF3",
      split: "#E7E7E7",
      divider: "#E7E7E7",
      grayDark: "#5D616B",
      grayMedium: "#8F959E",
      grayLight: "#F4F6F8",
      edge: "#E1E5EB",
      hairline: "#E1E5EB",
      warning: "#FEAC00",
      warningLight: "#FEF6E5",
      "warning-bg": "#FEF6E5",
      overdue: "#FF950A",
      control: "#C9CFD8",
      controlActive: "#E0E4E8",
      canvas: "#FFFFFF",
      canvasSoft: "#F4F6F8",
      "canvas-soft": "#F4F6F8",
      mute: "#8F959E",
      disabled: "#C9CFD8"
    },
    fontSize: {
      "display-lg": ["28px", "40px"],
      "display-md": ["24px", "32px"],
      "title-lg": ["20px", "32px"],
      "title-md": ["18px", "28px"],
      "title-sm": ["16px", "24px"],
      "body-md": ["14px", "20px"],
      "body-sm": ["13px", "18px"],
      caption: ["12px", "18px"],
      micro: ["10px", "16px"]
    },
    borderRadius: {
      xs: "2px",
      sm: "4px",
      md: "6px",
      lg: "8px",
      pill: "20px"
    },
    boxShadow: {
      light: "0 0 4px 0 rgba(0, 0, 0, 0.1)",
      heavy: "0 0 10px rgba(0, 0, 0, 0.3)",
      split: "0 -1px 0 0 #F4F6F8"
    }
  },
  shortcuts: {
    "zx-card":
      "bg-canvas text-black border border-edge rounded-8px p-20px shadow-none",
    "zx-page": "min-h-full bg-grayLight text-14px text-black leading-20px",
    "zx-control": "h-8 rounded-sm text-body-md",
    "zx-touch":
      "relative before:absolute before:inset-x-0 before:top-1/2 before:h-11 before:-translate-y-1/2 before:content-['']"
  },
  rules: [
    ["gutter-stable", { "scrollbar-gutter": "stable" }],
    ["drag-area", { "app-region": "drag" }],
    ["no-drag-area", { "app-region": "no-drag" }],
    [
      "bg-layout-gradient",
      { background: "var(--zx-gradient-layout)" }
    ]
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  safelist: [
    ...Array.from({ length: 24 }, (_, i) => `grid-cols-${i + 1}`),
    ...Array.from({ length: 24 }, (_, i) => `col-span-${i + 1}`)
  ]
});
