import { useOutletContext } from "react-router-dom";
import { Box, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import { Panel, SectionTitle } from "./adminPageUi";

export default function ProfilePage() {
  const { me, user, loading, schools, subadmins, selectedSchool } = useOutletContext();

  return (
    <Grid container spacing={2.5}>

      <Panel>
        <CardContent className="relative z-10 p-5 md:p-6">
          <Typography fontWeight={600} className="mb-1 font-inherit text-[1rem] text-slate-100">
            Workspace summary
          </Typography>
          <Typography variant="body2" className="text-sm leading-7 text-slate-400">
            Admin accounts are used to oversee the school setup and subadmin assignment flow. The sidebar keeps the
            four admin pages grouped together so the workspace feels more like the design you shared.
          </Typography>
        </CardContent>
      </Panel>

      <Grid item xs={12} md={5}>
        <Panel>
          <Box className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
            <SectionTitle title="Profile" subtitle="Current admin identity and permissions." />
          </Box>
          <CardContent className="relative z-10 p-5 md:p-6">
            {loading ? (
              <Typography className="text-sm text-slate-400">Loading...</Typography>
            ) : (
              <Stack spacing={1.75}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box className="grid h-14 w-14 place-items-center rounded-xl bg-sky-500 text-[1.1rem] font-black text-white shadow-[0_16px_30px_rgba(56,189,248,0.25)]">
                    {(me?.name || user?.name || "A").slice(0, 1).toUpperCase()}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={600} variant="h6" className="font-inherit text-[1rem] leading-tight text-slate-100">
                      {me?.name || user?.name || "Admin"}
                    </Typography>
                    <Typography variant="body2" className="break-words text-sm text-slate-400">
                      {me?.email || user?.email || "-"}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1} className="flex-wrap">
                  <Chip icon={<WorkspacePremiumRoundedIcon />} label={user?.role || "admin"} color="primary" className="!rounded-lg !text-[0.72rem]" />
                  <Chip label={`${schools.length} schools`} variant="outlined" className="!rounded-lg !text-[0.72rem]" />
                  <Chip label={`${subadmins.length} subadmins`} variant="outlined" className="!rounded-lg !text-[0.72rem]" />
                </Stack>

                <Stack spacing={0.9}>
                  <Typography variant="body2" className="text-sm text-slate-300">
                    <b>Phone:</b> {me?.phone || "-"}
                  </Typography>
                  <Typography variant="body2" className="text-sm text-slate-300">
                    <b>Role:</b> {me?.role || user?.role || "-"}
                  </Typography>
                </Stack>

                <Box
                  className="mt-1 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3"
                >
                  <Typography variant="caption" className="mb-1 block text-[0.72rem] text-slate-400">
                    Account note
                  </Typography>
                  <Typography variant="body2" className="text-sm text-slate-200">
                    This profile view is read-only for now. It reflects the same admin data already loaded by the existing
                    service calls.
                  </Typography>
                </Box>
              </Stack>
            )}
          </CardContent>
        </Panel>
      </Grid>

      <Grid item xs={12} md={7}>
        <Stack spacing={2.5}>
          {/* <Panel>
            <CardContent className="relative z-10 p-5 md:p-6">
              <Typography fontWeight={600} className="mb-1 font-inherit text-[1rem] text-slate-100">
                Workspace summary
              </Typography>
              <Typography variant="body2" className="text-sm leading-7 text-slate-400">
                Admin accounts are used to oversee the school setup and subadmin assignment flow. The sidebar keeps the
                four admin pages grouped together so the workspace feels more like the design you shared.
              </Typography>
            </CardContent>
          </Panel> */}

          <Panel>
            <CardContent className="relative z-10 p-5 md:p-6">
              <Typography fontWeight={600} className="mb-1 font-inherit text-[1rem] text-slate-100">
                Quick stats
              </Typography>
              <Stack direction="row" spacing={1.5} className="flex-wrap">
                <Chip label={`${schools.length} schools`} className="!rounded-lg !text-[0.72rem]" />
                <Chip label={`${subadmins.length} subadmins`} className="!rounded-lg !text-[0.72rem]" />
                <Chip label={selectedSchool?.name || "No school selected"} variant="outlined" className="!rounded-lg !text-[0.72rem]" />
              </Stack>
            </CardContent>
          </Panel>

          <Panel>
            <CardContent className="relative z-10 p-5 md:p-6">
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box className="grid h-10 w-10 place-items-center rounded-lg bg-white/5 text-sky-400">
                  <ManageAccountsRoundedIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography fontWeight={600} className="font-inherit text-[0.95rem] text-slate-100">
                    Profile
                  </Typography>
                  <Typography variant="caption" className="text-[0.72rem] text-slate-400">
                    Dedicated page for admin identity
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Panel>
        </Stack>
      </Grid>
    </Grid>
  );
}
