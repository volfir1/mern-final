// src/theme/Theme.jsx
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#695CFE",
    },
    background: {
      default: "#E4E9F7",
      paper: "#FFF",
    },
    text: {
      primary: "#707070",
    },
  },
});

export default theme;