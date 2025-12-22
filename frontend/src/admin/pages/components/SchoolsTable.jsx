import {
  Box,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

export default function SchoolsTable({ schools, selectedSchoolId, onSelect }) {
  return (
    <Paper variant="outlined" sx={{ bgcolor: "background.paper", borderColor: "rgba(255,255,255,0.12)" }}>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography fontWeight={800}>Schools</Typography>
        <Typography variant="caption" sx={{ opacity: 0.75 }}>
          Select a school to manage subadmins
        </Typography>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {schools?.length ? (
            schools.map((s) => (
              <TableRow key={s.id} hover selected={selectedSchoolId === s.id}>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography fontWeight={700}>{s.name}</Typography>
                    {selectedSchoolId === s.id ? <Chip size="small" label="Selected" color="primary" /> : null}
                  </Box>
                </TableCell>
                <TableCell>{s.email || "-"}</TableCell>
                <TableCell>{s.phone || "-"}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Manage subadmins">
                    <IconButton onClick={() => onSelect?.(s.id)} size="small">
                      <ArrowForwardRoundedIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} sx={{ opacity: 0.7 }}>
                No schools found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}


