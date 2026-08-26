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
import { Link, Outlet, useLocation } from "react-router-dom";

const drawerWidth = "15vw";

export default function DashboardLayout() {
  // Only "runs" is forwarded, not the whole search string — Explore's own
  // "run" param must not leak into the other two pages.
  const location = useLocation();
  const runsParam = new URLSearchParams(location.search).get("runs");
  const sharedSearch = runsParam ? `?${new URLSearchParams({ runs: runsParam })}` : "";

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
					<ListItemButton component={Link} to={{ pathname: "/", search: sharedSearch }}>
						<ListItemText primary="Memory Usage" />
					</ListItemButton>

					<ListItemButton component={Link} to={{ pathname: "/datasets", search: sharedSearch }}>
						<ListItemText primary="Data Quality" />
					</ListItemButton>

					<ListItemButton component={Link} to="/explore">
						<ListItemText primary="Explore" />
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