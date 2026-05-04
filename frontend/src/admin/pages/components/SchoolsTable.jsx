import {
  Chip,
  IconButton,
  Paper,
  Stack,
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
            <TableCell align="right" className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-slate-400">
              Action
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {schools?.length ? (
            schools.map((s) => {
              const active = selectedSchoolId === s.id;
              return (
                <TableRow
                  key={s.id}
                  hover
                  selected={active}
                  className={active ? "bg-sky-500/10" : "transition-colors duration-200 hover:bg-white/5"}
                >
                  <TableCell className="px-4 py-3">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography fontWeight={500} className="font-inherit text-[0.9rem] text-slate-100">
                        {s.name}
                      </Typography>
                      {active ? <Chip size="small" label="Selected" color="primary" className="!rounded-lg !text-[0.68rem]" /> : null}
                    </Stack>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-slate-300">{s.email || "-"}</TableCell>
                  <TableCell className="px-4 py-3 text-slate-300">{s.phone || "-"}</TableCell>
                  <TableCell align="right" className="px-4 py-3">
                    <Tooltip title="Manage subadmins">
                      <IconButton
                        onClick={() => onSelect?.(s.id)}
                        size="small"
                        className="border border-white/10 bg-white/[0.03] transition-transform duration-200 hover:scale-105 hover:bg-sky-500/10"
                      >
                        <ArrowForwardRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-slate-400">
                No schools found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}
