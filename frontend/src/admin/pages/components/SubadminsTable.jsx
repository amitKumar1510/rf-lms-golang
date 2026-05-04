import {
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";

export default function SubadminsTable({ subadmins }) {
  return (
    <Paper
      variant="outlined"
      className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_18px_50px_rgba(2,6,23,0.28)] backdrop-blur-xl"
    >
      <Box className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(34,197,94,0.04))] p-5">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-emerald-400">
            <GroupsRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography fontWeight={900} className="font-['Montserrat'] text-[0.95rem] text-slate-100">
              Subadmins
            </Typography>
            <Typography variant="caption" className="text-[0.72rem] text-slate-400">
              Users assigned to the selected school
            </Typography>
          </Box>
        </Stack>
        <Chip size="small" label={`${subadmins?.length || 0} total`} className="!rounded-full !text-[0.72rem]" />
      </Box>

      <Table size="small" className="[&_.MuiTableCell-root]:border-b-white/10">
        <TableHead>
          <TableRow>
            <TableCell className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-slate-400">
              Name
            </TableCell>
            <TableCell className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-slate-400">
              Email
            </TableCell>
            <TableCell className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-slate-400">
              Phone
            </TableCell>
            <TableCell className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-slate-400">
              Active
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subadmins?.length ? (
            subadmins.map((u) => (
              <TableRow
                key={u.user_id}
                hover
                className="transition-colors duration-200 hover:bg-white/5"
              >
                <TableCell className="px-4 py-3">
                  <Typography fontWeight={800} className="font-['Montserrat'] text-[0.9rem] text-slate-100">
                    {u.name}
                  </Typography>
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-300">{u.email}</TableCell>
                <TableCell className="px-4 py-3 text-slate-300">{u.phone || "-"}</TableCell>
                <TableCell className="px-4 py-3">
                  {u.is_active ? <Chip size="small" color="success" label="Active" className="!rounded-full !text-[0.68rem]" /> : <Chip size="small" label="Inactive" className="!rounded-full !text-[0.68rem]" />}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-slate-400">
                No subadmins for this school yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}
