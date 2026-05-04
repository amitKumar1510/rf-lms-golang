import { useNavigate, useOutletContext } from "react-router-dom";
import { Box, Button, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import { Panel } from "./adminPageUi";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { me, user, schools, subadmins, currentRole, roleInfo } = useOutletContext();

  const metrics = [
    {
      label: "Schools",
      value: schools.length,
      caption: "Registered campuses",
      icon: SchoolRoundedIcon,
      accent: "primary.main",
    },
    {
      label: "Subadmins",
      value: subadmins.length,
      caption: "Linked to the active school",
      icon: GroupsRoundedIcon,
      accent: "success.main",
    },
    {
      label: "Role",
      value: currentRole,
      caption: "Current workspace access",
      icon: WorkspacePremiumRoundedIcon,
      accent: "info.main",
    },
  ];

  const taskCards = [
    {
      title: "Create School",
      text: "Add a new campus with contact and address details, then keep moving through the same admin workflow.",
      action: () => navigate("/admin/create-school"),
    },
    {
      title: "Create Subadmins",
      text: "Pick a school and manage the users responsible for that campus from a dedicated page.",
      action: () => navigate("/admin/create-subadmins"),
    },
    {
      title: "Profile",
      text: "Review the admin account information that is already loaded from the existing profile service.",
      action: () => navigate("/admin/profile"),
    },
  ];

  return (
    <Box className="mx-auto w-full max-w-7xl">
      <Stack spacing={2.5}>
        <Panel>
          <CardContent className="relative z-10 p-5 md:p-6 lg:p-7">
            <Grid container spacing={3} alignItems="stretch">
              <Grid item xs={12} lg={8}>
                <Stack spacing={2.25} className="h-full justify-between">
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap" }}>
                    <Chip icon={<WorkspacePremiumRoundedIcon />} label={roleInfo?.badge || "Administrator"} color="primary" className="!rounded-lg !text-[0.72rem]" />
                    <Chip label={`${schools.length} schools`} variant="outlined" className="!rounded-lg !text-[0.72rem]" />
                    <Chip label={`${subadmins.length} subadmins`} variant="outlined" className="!rounded-lg !text-[0.72rem]" />
                  </Stack>

                  <Box>
                    <Typography
                      variant="h4"
                      fontWeight={600}
                      className="mb-2 max-w-2xl font-inherit text-[1.55rem] leading-tight md:text-[1.9rem] lg:text-[2.2rem]"
                    >
                      Welcome back, {me?.name || user?.name || "Admin"}
                    </Typography>
                    <Typography variant="body1" className="max-w-2xl text-sm leading-7 text-slate-400 md:text-[0.95rem]">
                      {roleInfo?.subtitle || "Manage schools, create subadmins, and keep the admin workspace organized."}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1.25} className="flex-wrap">
                    <Button
                      variant="contained"
                      onClick={() => navigate("/admin/create-school")}
                      startIcon={<SchoolRoundedIcon />}
                      className="!rounded-lg !px-4 !py-2 !text-sm !shadow-none transition-transform duration-200 hover:scale-[1.01]"
                    >
                      Create School
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => navigate("/admin/create-subadmins")}
                      startIcon={<GroupsRoundedIcon />}
                      className="!rounded-lg !px-4 !py-2 !text-sm"
                    >
                      Create Subadmins
                    </Button>
                    <Button
                      variant="text"
                      onClick={() => navigate("/admin/profile")}
                      startIcon={<ManageAccountsRoundedIcon />}
                      className="!rounded-lg !px-4 !py-2 !text-sm"
                    >
                      Profile
                    </Button>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Panel>

        <Box className="flex gap-[10px] overflow-x-auto pb-1">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Panel key={metric.label} sx={{ flex: "1 1 0", minWidth: { xs: 280, sm: 280, md: 0 } }}>
                <CardContent className="relative z-10 p-5 md:p-6">
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} className="h-full">
                    <Box>
                      <Typography variant="body2" className="mb-1 text-[0.72rem] uppercase tracking-[0.16em] text-slate-400">
                        {metric.label}
                      </Typography>
                      <Typography
                        variant="h4"
                        fontWeight={600}
                        className="break-words font-inherit text-[1.55rem] leading-tight text-slate-100 md:text-[1.8rem]"
                      >
                        {metric.value}
                      </Typography>
                      <Typography variant="body2" className="mt-1 text-sm text-slate-400">
                        {metric.caption}
                      </Typography>
                    </Box>
                    <Box
                      className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5"
                      style={{ color: metric.accent }}
                    >
                      <Icon />
                    </Box>
                  </Stack>
                </CardContent>
              </Panel>
            );
          })}
        </Box>

        <Box className="flex gap-[10px] overflow-x-auto pb-1">
          {taskCards.map((card) => (
            <Panel key={card.title} sx={{ flex: "1 1 0", minWidth: { xs: 280, sm: 280, md: 0 } }}>
              <CardContent className="relative z-10 p-5 md:p-6">
                <Stack spacing={2.25} className="h-full">
                  <Typography fontWeight={600} className="font-inherit text-[1rem] text-slate-100">
                    {card.title}
                  </Typography>
                  <Typography variant="body2" className="text-sm leading-7 text-slate-400">
                    {card.text}
                  </Typography>
                  <Button variant="outlined" onClick={card.action} className="!rounded-lg !px-4 !py-2 !text-sm">
                    Open
                  </Button>
                </Stack>
              </CardContent>
            </Panel>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}
