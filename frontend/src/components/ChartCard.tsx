import { Card, CardContent, Typography, Box } from "@mui/material";
import type { ReactNode } from "react";

interface ChartCardProps {
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}

function ChartCard({ title, children, actions }: ChartCardProps) {
  return (
    <Card sx={{ minHeight: 300, minWidth: 300 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", p: 2 }}>
        <Typography variant="h6">{title}</Typography>
        {actions}
      </Box>

      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default ChartCard