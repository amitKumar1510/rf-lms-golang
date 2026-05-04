import {
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
    <Paper
      variant="outlined"
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_18px_50px_rgba(2,6,23,0.28)] backdrop-blur-xl"
    >
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
                  <Typography fontWeight={500} className="font-inherit text-[0.9rem] text-slate-100">
                    {u.name}
                  </Typography>
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-300">{u.email}</TableCell>
                <TableCell className="px-4 py-3 text-slate-300">{u.phone || "-"}</TableCell>
                <TableCell className="px-4 py-3">
                  {u.is_active ? <Chip size="small" color="success" label="Active" className="!rounded-lg !text-[0.68rem]" /> : <Chip size="small" label="Inactive" className="!rounded-lg !text-[0.68rem]" />}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-slate-400">
                Subadmin not created yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}
