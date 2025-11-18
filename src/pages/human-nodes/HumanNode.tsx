import { useParams, Link } from "react-router";
import { Box, Card, CardContent, Chip, Stack, Typography, Button } from "@mui/material";

const HumanNode: React.FC = () => {
  const { id } = useParams();
  const name = id ?? "Unknown";

  return (
    <Box className="app-page" display="flex" flexDirection="column" gap={2}>
      <Typography variant="h5">Human node: {name}</Typography>
      <Typography variant="body2" color="text.secondary">
        Profile overview and participation summary.
      </Typography>

      <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6">Summary</Typography>
            <Stack direction="row" spacing={2} mt={1} flexWrap="wrap">
              <Chip label="ACM: —" variant="outlined" />
              <Chip label="MM: —" variant="outlined" />
            </Stack>
            <Typography variant="body2" color="text.secondary" mt={1.5}>
              Add bio, chamber affiliations, and last activity here.
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ width: { xs: "100%", md: 320 } }}>
          <CardContent>
            <Typography variant="h6">Actions</Typography>
            <Stack direction="row" spacing={1} mt={1}>
              <Button component={Link} to="/human-nodes" variant="outlined" size="small">
                Back to list
              </Button>
              <Button variant="contained" size="small">
                Contact
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default HumanNode;
