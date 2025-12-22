import { useEffect, useState } from "react";
import { Alert, Button, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import SubadminFormDialog from "../../../admin/pages/components/SubadminFormDialog";
import SubadminsManageTable from "../components/SubadminsManageTable";
import * as subadminService from "../../services/subadminService";

export default function SubadminsTab({ schoolId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [actionErr, setActionErr] = useState(null);

  const load = async () => {
    if (!schoolId) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await subadminService.getSubadminsBySchoolId(schoolId);
      setItems(data);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load subadmins");
    } finally {
      setLoading(false);
    }
  };

  const onCreate = async (payload) => {
    // Ensure school_id matches current scope
    await subadminService.createSubadmin({ ...payload, school_id: schoolId });
    await load();
  };

  const onToggleActive = async (row) => {
    setActionErr(null);
    try {
      if (row.is_active) await subadminService.deactivateSubadmin(row.user_id);
      else await subadminService.activateSubadmin(row.user_id);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Action failed");
    }
  };

  const onDelete = async (row) => {
    setActionErr(null);
    try {
      await subadminService.deleteSubadmin(row.user_id);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Delete failed");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography fontWeight={900}>Subadmins (School)</Typography>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setOpenCreate(true)} variant="contained" startIcon={<AddRoundedIcon />} disabled={!schoolId}>
              Create
            </Button>
            <Button onClick={load} variant="outlined" startIcon={<RefreshRoundedIcon />} disabled={!schoolId || loading}>
              Refresh
            </Button>
          </Stack>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <SubadminFormDialog
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onSubmit={onCreate}
          schoolId={schoolId}
        />
        {!schoolId ? (
          <Alert severity="warning">No school_id found for this subadmin.</Alert>
        ) : err ? (
          <Alert severity="error">{String(err)}</Alert>
        ) : actionErr ? (
          <Alert severity="error">{String(actionErr)}</Alert>
        ) : loading ? (
          <Typography sx={{ opacity: 0.7 }}>Loading...</Typography>
        ) : (
          <SubadminsManageTable subadmins={items} onToggleActive={onToggleActive} onDelete={onDelete} />
        )}
      </CardContent>
    </Card>
  );
}


