import {
  Box,
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
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";

export default function SchoolsTable({ schools, selectedSchoolId, onSelect }) {
  return (
    <Paper
      variant="outlined"
      className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_18px_50px_rgba(2,6,23,0.28)] backdrop-blur-xl"
    >
      <Box className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[linear-gradient(135deg,rgba(37,99,235,0.10),rgba(14,165,233,0.04))] p-5">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-sky-400">
            <SchoolRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography fontWeight={900} className="font-['Montserrat'] text-[0.95rem] text-slate-100">
              Schools
            </Typography>
            <Typography variant="caption" className="text-[0.72rem] text-slate-400">
              Select a campus to update the subadmin list
            </Typography>
          </Box>
        </Stack>
        <Chip size="small" label={`${schools?.length || 0} total`} className="!rounded-full !text-[0.72rem]" />
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
                      <Typography fontWeight={800} className="font-['Montserrat'] text-[0.9rem] text-slate-100">
                        {s.name}
                      </Typography>
                      {active ? <Chip size="small" label="Selected" color="primary" className="!rounded-full !text-[0.68rem]" /> : null}
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
