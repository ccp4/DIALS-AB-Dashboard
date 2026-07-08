import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { Link, Outlet } from "react-router-dom";

const drawerWidth = "15vw";

export default function DashboardLayout({ children }) {
  return (
    <Box sx={{ display: "flex" }}>
      {/* Top bar */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        color="secondary"
      >
        <Toolbar>
          <Typography variant="h6">DIALS A-B Dashboard</Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />

				<List>
					<ListItemButton component={Link} to="/">
						<ListItemText primary="Memory Usage" />
					</ListItemButton>

					<ListItemButton component={Link} to="/datasets">
						<ListItemText primary="Data Quality" />
					</ListItemButton>
				</List>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}