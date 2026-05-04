import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Alert, Box, Button, CardContent, Divider, Grid, Stack, Typography } from "@mui/material";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { Panel, SectionTitle } from "./adminPageUi";
import SchoolsTable from "./components/SchoolsTable";
import SubadminsTable from "./components/SubadminsTable";
import SubadminFormDialog from "./components/SubadminFormDialog";

export default function CreateSubadminsPage() {
  const {
    schools,
    selectedSchoolId,
    setSelectedSchoolId,
    subadmins,
    loading,
    subLoading,
    subErr,
    selectedSchool,
    onCreateSubadmin,
  } = useOutletContext();

  const [openCreateSubadmin, setOpenCreateSubadmin] = useState(false);

  return (
    <Stack spacing={2.5}>

      <Panel>
        <CardContent className="relative z-10 p-5 md:p-6">
          <Typography fontWeight={600} className="mb-1 font-inherit text-[1rem] text-slate-100">
            Manage users
          </Typography>
          <Typography variant="body2" className="text-sm leading-7 text-slate-400">
            This page keeps the school selector, the subadmin list, and the create action together so the task is
            fully separated from the other admin pages.
          </Typography>
        </CardContent>
      </Panel>

      <Panel>
        <CardContent className="relative z-10 p-5 md:p-6">
          <SectionTitle
            title="Create Subadmins"
            subtitle="Select a school, review the current users, and create a new subadmin for that campus."
            action={
              <Button
                variant="contained"
                startIcon={<GroupAddRoundedIcon />}
                disabled={!selectedSchoolId}
                onClick={() => setOpenCreateSubadmin(true)}
                className="!rounded-lg !px-4 !py-2 !text-sm !shadow-none transition-transform duration-200 hover:scale-[1.01]"
              >
                Create Subadmin
              </Button>
            }
          />
          <Typography variant="caption" className="text-[0.72rem] text-slate-400">
            Selected school: {selectedSchool?.name || selectedSchoolId || "-"}
          </Typography>
        </CardContent>
      </Panel>


      <Grid item xs={12} lg={7}>
        {loading ? (
          <Panel>
            <CardContent className="relative z-10 p-5 md:p-6">
              <Typography className="text-sm text-slate-400">Loading schools...</Typography>
            </CardContent>
          </Panel>
        ) : (
          <SchoolsTable schools={schools} selectedSchoolId={selectedSchoolId} onSelect={setSelectedSchoolId} />
        )}
      </Grid>


      <Stack spacing={2.5}>
        <Panel>
          <CardContent className="relative z-10 p-5 md:p-6">
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box className="grid h-10 w-10 place-items-center rounded-lg bg-white/5 text-sky-400">
                  <GroupsRoundedIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography fontWeight={600} className="font-inherit text-[0.95rem] text-slate-100">
                    Subadmins
                  </Typography>
                  <Typography variant="caption" className="text-[0.72rem] text-slate-400">
                    Users assigned to the selected school
                  </Typography>
                </Box>
              </Stack>
              <Divider className="border-white/10" />
            </Stack>

            <Box className="mt-4">
              {subLoading ? (
                <Typography className="text-sm text-slate-400">Loading...</Typography>
              ) : (
                <SubadminsTable subadmins={subadmins} />
              )}
            </Box>
          </CardContent>
        </Panel>

        {/* <Panel>
              <CardContent className="relative z-10 p-5 md:p-6">
                <Typography fontWeight={600} className="mb-1 font-inherit text-[1rem] text-slate-100">
                  Manage users
                </Typography>
                <Typography variant="body2" className="text-sm leading-7 text-slate-400">
                  This page keeps the school selector, the subadmin list, and the create action together so the task is
                  fully separated from the other admin pages.
                </Typography>
              </CardContent>
            </Panel> */}
      </Stack>


      <SubadminFormDialog
        open={openCreateSubadmin}
        onClose={() => setOpenCreateSubadmin(false)}
        onSubmit={onCreateSubadmin}
        schoolId={selectedSchoolId}
      />

      {subErr ? (
        <Alert
          severity="error"
          className="rounded-xl border border-red-400/20 bg-red-950/40"
        >
          {String(subErr)}
        </Alert>
      ) : null}
    </Stack>
  );
}
