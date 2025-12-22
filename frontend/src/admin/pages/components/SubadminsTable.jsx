import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

export default function SubadminsTable({ subadmins }) {
  return (
    <Paper variant="outlined" sx={{ bgcolor: "background.paper", borderColor: "rgba(255,255,255,0.12)" }}>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography fontWeight={800}>Subadmins</Typography>
        <Chip size="small" label={`${subadmins?.length || 0} total`} />
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subadmins?.length ? (
            subadmins.map((u) => (
              <TableRow key={u.user_id} hover>
                <TableCell>
                  <Typography fontWeight={700}>{u.name}</Typography>
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.phone || "-"}</TableCell>
                <TableCell>{u.is_active ? <Chip size="small" color="success" label="Active" /> : <Chip size="small" label="Inactive" />}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} sx={{ opacity: 0.7 }}>
                No subadmins for this school yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}


