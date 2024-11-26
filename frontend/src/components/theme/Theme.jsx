import { createTheme } from "@mui/material/styles";
import { useTheme } from "./ThemeContext";

export const useAppTheme = () => {
  const { isDarkMode } = useTheme();

  return createTheme({
    palette: {
      mode: isDarkMode ? "dark" : "light",
      primary: {
        main: "#695CFE",
      },
      background: {
        default: isDarkMode ? "#18191A" : "#E4E9F7",
        paper: isDarkMode ? "#242526" : "#FFF",
      },
      text: {
        primary: isDarkMode ? "#CCC" : "#707070",
      },
    },
  });
};
