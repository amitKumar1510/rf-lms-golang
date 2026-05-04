import { useOutletContext } from "react-router-dom";
import { Box, Button, CardContent, Chip, Divider, Grid, Stack, TextField, Typography } from "@mui/material";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Panel, SectionTitle } from "./adminPageUi";
import SchoolsTable from "./components/SchoolsTable";

export default function CreateSchoolPage() {
  const { newSchool, setNewSchool, canCreate, onCreateSchool, schools, selectedSchoolId, setSelectedSchoolId } =
    useOutletContext();

  return (
    <Box className="mx-auto w-full max-w-7xl">
      <Stack spacing={2.5}>
        <Panel>
          <CardContent className="relative z-10 p-5 md:p-6 lg:p-7">
            <Grid container spacing={3} alignItems="stretch">
              <Grid item xs={12} lg={8}>
                <Stack spacing={2.25} className="h-full justify-between">
                  <Stack direction="row" spacing={1} className="flex-wrap">
                    <Chip label="Campus setup" color="primary" className="!rounded-lg !text-[0.72rem]" />
                    <Chip
                      label={canCreate ? "Ready to submit" : "Fill required fields"}
                      color={canCreate ? "success" : "default"}
                      variant={canCreate ? "filled" : "outlined"}
                      className="!rounded-lg !text-[0.72rem]"
                    />
                  </Stack>

                  <Box>
                    <Typography variant="h4" fontWeight={600} className="text-[1.55rem] leading-tight md:text-[1.9rem] lg:text-[2.2rem]">
                      Create School
                    </Typography>
                    <Typography variant="body1" className="mt-2 max-w-2xl text-sm leading-7 text-slate-400 md:text-[0.95rem]">
                      Add a new campus with clean contact and address details, then manage subadmins from the next page
                      without changing the backend flow.
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1.25} className="flex-wrap">
                    <Button
                      type="submit"
                      form="create-school-form"
                      variant="contained"
                      disabled={!canCreate}
                      startIcon={<AddRoundedIcon />}
                      className="!rounded-lg !px-4 !py-2 !text-sm !shadow-none transition-transform duration-200 hover:scale-[1.01]"
                    >
                      Create school
                    </Button>
                    <Chip
                      size="small"
                      icon={<SchoolRoundedIcon />}
                      label={`${schools.length} schools`}
                      variant="outlined"
                      className="!rounded-lg !text-[0.72rem]"
                    />
                  </Stack>
                </Stack>
              </Grid>

              <Grid item xs={12} lg={4}>

              </Grid>
            </Grid>
          </CardContent>
        </Panel>

        <Panel>
          <Box className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
            <SectionTitle
              title="Create School"
              subtitle="Fill the campus details and keep the layout compact and readable."
              action={
                <Chip
                  size="small"
                  label={canCreate ? "Ready" : "Incomplete"}
                  color={canCreate ? "success" : "default"}
                  className="!rounded-lg !text-[0.72rem]"
                />
              }
            />
          </Box>

          <CardContent className="relative z-10 p-5 md:p-6 lg:p-7">
            <Box component="form" id="create-school-form" onSubmit={onCreateSchool}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="body2" className="text-[0.72rem] uppercase tracking-[0.16em] text-slate-400">
                    Basic details
                  </Typography>
                  <Divider className="mt-3 border-white/10" />
                </Box>

                <Grid container spacing={1.25}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="School name"
                      value={newSchool.name}
                      onChange={(e) => setNewSchool((s) => ({ ...s, name: e.target.value }))}
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Phone"
                      value={newSchool.phone}
                      onChange={(e) => setNewSchool((s) => ({ ...s, phone: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Email"
                      type="email"
                      value={newSchool.email}
                      onChange={(e) => setNewSchool((s) => ({ ...s, email: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <Box>
                  <Typography variant="body2" className="text-[0.72rem] uppercase tracking-[0.16em] text-slate-400">
                    Address details
                  </Typography>
                  <Divider className="mt-3 border-white/10" />
                </Box>

                <Grid container spacing={1.25}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Street"
                      value={newSchool.street}
                      onChange={(e) => setNewSchool((s) => ({ ...s, street: e.target.value }))}
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="City"
                      value={newSchool.city}
                      onChange={(e) => setNewSchool((s) => ({ ...s, city: e.target.value }))}
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="State"
                      value={newSchool.state}
                      onChange={(e) => setNewSchool((s) => ({ ...s, state: e.target.value }))}
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Country"
                      value={newSchool.country}
                      onChange={(e) => setNewSchool((s) => ({ ...s, country: e.target.value }))}
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Postal code"
                      value={newSchool.postal_code}
                      onChange={(e) => setNewSchool((s) => ({ ...s, postal_code: e.target.value }))}
                      required
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!canCreate}
                    startIcon={<AddRoundedIcon />}
                    className="!rounded-lg !px-4 !py-2 !text-sm !shadow-none transition-transform duration-200 hover:scale-[1.01]"
                  >
                    Create school
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </CardContent>
        </Panel>


        <Grid item xs={12}>
          <Panel>
            <CardContent className="relative z-10 p-5 md:p-6">
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box className="grid h-10 w-10 place-items-center rounded-lg bg-white/5 text-sky-400">
                  <SchoolRoundedIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography fontWeight={600} className="text-[0.95rem] text-slate-100">
                    Created Schools
                  </Typography>
                  <Typography variant="caption" className="text-[0.72rem] text-slate-400">
                    All schools currently added in the workspace
                  </Typography>
                </Box>
              </Stack>
              <Typography variant="body2" className="mt-4 text-sm text-slate-400">
                {schools.length} registered campus{schools.length === 1 ? "" : "es"}
              </Typography>
            </CardContent>
          </Panel>
        </Grid>

        <Grid item xs={12}>
          <Panel>
            <CardContent className="relative z-10 p-5 md:p-6">
              <SchoolsTable schools={schools} selectedSchoolId={selectedSchoolId} onSelect={setSelectedSchoolId} />
            </CardContent>
          </Panel>
        </Grid>

      </Stack>
    </Box>
  );
}
