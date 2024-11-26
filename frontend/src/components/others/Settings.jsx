import React from "react";
import {
  Container,
  Typography,
  Paper,
  Switch,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Box,
} from "@mui/material";
import {
  MoonIcon,
  BellIcon,
  LockClosedIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./Theme"; // Correct import

// Utility to handle icon fallback if undefined
const SettingItem = ({ icon, title, description, action }) => {
  const IconComponent = icon || MoonIcon; // Default to MoonIcon if icon is undefined

  return (
    <ListItem>
      <ListItemIcon className="text-gray-600 dark:text-gray-300">
        {React.createElement(IconComponent, { className: "w-6 h-6" })}
      </ListItemIcon>
      <ListItemText
        primary={<Typography variant="subtitle1">{title}</Typography>}
        secondary={
          <Typography
            variant="body2"
            className="text-gray-500 dark:text-gray-400"
          >
            {description}
          </Typography>
        }
      />
      <Box ml="auto">{action}</Box>
    </ListItem>
  );
};

const Settings = () => {
  const { isDarkMode, toggleTheme } = useTheme(); // Use correct context for dark mode
  const [notifications, setNotifications] = React.useState(true);
  const navigate = useNavigate();

  const toggleNotifications = () => setNotifications(!notifications);

  const handleExit = () => {
    navigate("/dashboard"); // Navigate to dashboard or desired route
  };

  return (
    <Container
      maxWidth="md"
      className="py-8 bg-background text-foreground dark:bg-gray-900 dark:text-gray-100"
    >
      <Box className="flex justify-between items-center mb-6">
        <Typography
          variant="h4"
          className="font-light text-gray-800 dark:text-gray-100"
        >
          Settings
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<XMarkIcon className="w-5 h-5" />}
          onClick={handleExit}
          className="text-gray-600 border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300"
        >
          Exit
        </Button>
      </Box>
      <Paper
        elevation={3}
        className="overflow-hidden bg-white dark:bg-gray-800"
      >
        <List className="py-2">
          <SettingItem
            icon={MoonIcon}
            title="Dark Mode"
            description="Toggle dark mode for a more comfortable viewing experience in low light conditions."
            action={
              <Switch
                checked={isDarkMode}
                onChange={toggleTheme} // Change this to toggleTheme
                color="primary"
              />
            }
          />
          <Divider variant="inset" component="li" className="my-2" />
          <SettingItem
            icon={BellIcon}
            title="Notifications"
            description="Receive alerts and updates about your account and activities."
            action={
              <Switch
                checked={notifications}
                onChange={toggleNotifications}
                color="primary"
              />
            }
          />
          <Divider variant="inset" component="li" className="my-2" />
          <SettingItem
            icon={LockClosedIcon}
            title="Security"
            description="Manage your account security settings and preferences."
            action={
              <Typography
                variant="body2"
                className="text-blue-500 cursor-pointer dark:text-blue-300"
              >
                Manage
              </Typography>
            }
          />
          <Divider variant="inset" component="li" className="my-2" />
          <SettingItem
            icon={UserIcon}
            title="Account Information"
            description="View and update your personal information and preferences."
            action={
              <Typography
                variant="body2"
                className="text-blue-500 cursor-pointer dark:text-blue-300"
              >
                Edit
              </Typography>
            }
          />
        </List>
      </Paper>
    </Container>
  );
};

export default Settings;
