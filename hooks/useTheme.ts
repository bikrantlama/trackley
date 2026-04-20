import { useApp } from "../context/AppContext";
import { THEMES, ThemeColors } from "../constants/themes";

export function useTheme(): ThemeColors {
  const { themeId } = useApp();
  return THEMES[themeId]?.colors || THEMES.obsidian.colors;
}

export function useThemeId(): string {
  const { themeId } = useApp();
  return themeId;
}
