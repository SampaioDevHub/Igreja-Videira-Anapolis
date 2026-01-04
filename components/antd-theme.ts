import { theme as antdTheme } from "antd"
import type { ThemeConfig } from "antd"

const baseTokens: ThemeConfig["token"] = {
  borderRadius: 12,
}

const lightTokens: ThemeConfig["token"] = {
  colorPrimary: "#1F4E79",
  colorInfo: "#1F4E79",
  colorSuccess: "#15803D",
  colorWarning: "#B45309",
  colorError: "#B91C1C",
  colorText: "#0F172A",
  colorTextSecondary: "#475569",
  colorBgLayout: "#F5F7FA",
  colorBgContainer: "#FFFFFF",
  colorBgElevated: "#FFFFFF",
  colorBorder: "#E2E8F0",
  colorSplit: "#E2E8F0",
  colorFillSecondary: "#F1F5F9",
  colorFillTertiary: "#E2E8F0",
}

const darkTokens: ThemeConfig["token"] = {
  colorPrimary: "#4C7DD9",
  colorInfo: "#4C7DD9",
  colorSuccess: "#22C55E",
  colorWarning: "#F59E0B",
  colorError: "#F87171",
  colorText: "#E2E8F0",
  colorTextSecondary: "#94A3B8",
  colorTextTertiary: "#64748B",
  colorBgLayout: "#0B1220",
  colorBgContainer: "#141E2E",
  colorBgElevated: "#182337",
  colorBorder: "#273449",
  colorBorderSecondary: "#2E3A51",
  colorSplit: "#233246",
  colorFillSecondary: "#1B263B",
  colorFillTertiary: "#162235",
  colorFillQuaternary: "#0F172A",
  boxShadow: "0 12px 28px rgba(0, 0, 0, 0.45)",
  boxShadowSecondary: "0 8px 20px rgba(0, 0, 0, 0.35)",
  boxShadowTertiary: "0 4px 12px rgba(0, 0, 0, 0.25)",
}

export const getAntdTheme = (isDark: boolean): ThemeConfig => ({
  algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  token: {
    ...baseTokens,
    ...(isDark ? darkTokens : lightTokens),
  },
  components: {
    Card: {
      headerBg: "transparent",
    },
    Table: {
      headerBg: isDark ? "#0F172A" : "#F8FAFC",
      rowHoverBg: isDark ? "#1E293B" : "#F1F5F9",
      headerColor: isDark ? "#E2E8F0" : "#0F172A",
    },
    Tag: {
      defaultBg: isDark ? "#1F2937" : "#F1F5F9",
      defaultColor: isDark ? "#E2E8F0" : "#0F172A",
    },
  },
})
