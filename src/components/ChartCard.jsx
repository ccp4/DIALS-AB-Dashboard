import { Card, CardContent, Typography, Box } from "@mui/material";

function ChartCard({ title, children, actions }) {
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