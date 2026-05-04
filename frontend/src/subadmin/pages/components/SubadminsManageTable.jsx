import { useState } from "react";
import {
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ToggleOffRoundedIcon from "@mui/icons-material/ToggleOffRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";

export default function SubadminsManageTable({ subadmins, onToggleActive, onDelete }) {
  const [busyId, setBusyId] = useState(null);

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subadmins?.length ? (
            subadmins.map((u) => (
              <TableRow key={u.user_id} hover>
                <TableCell>
                  <Typography fontWeight={500}>{u.name}</Typography>
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.phone || "-"}</TableCell>
                <TableCell>
                  {u.is_active ? <Chip size="small" color="success" label="Active" /> : <Chip size="small" label="Inactive" />}
                </TableCell>
                <TableCell align="right">
                  {/* Desktop actions */}
                  <Tooltip title={u.is_active ? "Deactivate" : "Activate"}>
                    <span>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={async () => {
                          setBusyId(u.user_id);
                          try {
                            await onToggleActive?.(u);
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        startIcon={u.is_active ? <ToggleOffRoundedIcon /> : <ToggleOnRoundedIcon />}
                        sx={{ display: { xs: "none", sm: "inline-flex" }, mr: 1 }}
                        disabled={busyId === u.user_id}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </span>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <span>
                      <Button
                        size="small"
                        color="error"
                        variant="contained"
                        onClick={async () => {
                          setBusyId(u.user_id);
                          try {
                            await onDelete?.(u);
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        startIcon={<DeleteOutlineRoundedIcon />}
                        sx={{ display: { xs: "none", sm: "inline-flex" } }}
                        disabled={busyId === u.user_id}
                      >
                        Delete
                      </Button>
                    </span>
                  </Tooltip>

                  {/* Mobile icon actions */}
                  <Tooltip title={u.is_active ? "Deactivate" : "Activate"}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={async () => {
                          setBusyId(u.user_id);
                          try {
                            await onToggleActive?.(u);
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        sx={{ display: { xs: "inline-flex", sm: "none" }, mr: 0.5 }}
                        disabled={busyId === u.user_id}
                      >
                        {u.is_active ? <ToggleOffRoundedIcon fontSize="small" /> : <ToggleOnRoundedIcon fontSize="small" />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={async () => {
                          setBusyId(u.user_id);
                          try {
                            await onDelete?.(u);
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        sx={{ display: { xs: "inline-flex", sm: "none" } }}
                        disabled={busyId === u.user_id}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} sx={{ opacity: 0.7 }}>
                No subadmins found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}



