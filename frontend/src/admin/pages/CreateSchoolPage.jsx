import { useOutletContext } from "react-router-dom";
import { Box, Button, CardContent, Chip, Grid, Stack, TextField, Typography } from "@mui/material";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Panel, SectionTitle } from "./adminPageUi";

export default function CreateSchoolPage() {
  const { newSchool, setNewSchool, canCreate, onCreateSchool, schools } = useOutletContext();

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12} lg={8}>
        <Panel>
          <Box className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
            <SectionTitle
              title="Create School"
              subtitle="Add a new campus and its address details."
              action={
                <Chip
                  size="small"
                  label={canCreate ? "Ready to submit" : "Fill required fields"}
                  color={canCreate ? "success" : "default"}
                  className="!rounded-full !text-[0.72rem]"
                />
              }
            />
          </Box>
          <CardContent className="relative z-10 p-5 md:p-6">
            <Box component="form" onSubmit={onCreateSchool}>
              <Grid container spacing={2}>
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
                <Grid item xs={12}>
                  <Stack direction="row" justifyContent="flex-end" className="pt-1">
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!canCreate}
                      startIcon={<AddRoundedIcon />}
                      className="!rounded-xl !px-4 !py-2 !text-sm !shadow-none transition-transform duration-200 hover:scale-[1.01]"
                    >
                      Create school
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Panel>
      </Grid>

      <Grid item xs={12} lg={4}>
        <Stack spacing={2.5}>
          <Panel>
            <CardContent className="relative z-10 p-5 md:p-6">
              <Typography fontWeight={900} className="mb-1 font-['Montserrat'] text-[1rem] text-slate-100">
                School setup
              </Typography>
              <Typography variant="body2" className="text-sm leading-7 text-slate-400">
                Use this form to add a campus. Once the school is saved, you can assign subadmins from the next page
                without changing any backend flow.
              </Typography>
            </CardContent>
          </Panel>

          <Panel>
            <CardContent className="relative z-10 p-5 md:p-6">
              <Typography fontWeight={900} className="mb-1 font-['Montserrat'] text-[1rem] text-slate-100">
                School count
              </Typography>
              <Typography variant="h4" fontWeight={900} className="text-2xl font-['Montserrat'] text-slate-100">
                {schools.length}
              </Typography>
              <Typography variant="body2" className="mt-1 text-sm text-slate-400">
                Registered campuses in the system
              </Typography>
            </CardContent>
          </Panel>

          <Panel>
            <CardContent className="relative z-10 p-5 md:p-6">
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-sky-400">
                  <SchoolRoundedIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography fontWeight={900} className="font-['Montserrat'] text-[0.95rem] text-slate-100">
                    Create School
                  </Typography>
                  <Typography variant="caption" className="text-[0.72rem] text-slate-400">
                    Dedicated page for campus setup
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
