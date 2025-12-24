import { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Radio,
  Stack,
  Typography,
} from "@mui/material";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import { useThemeManager } from "./ThemeManager";

export default function ThemeSettingsButton({ iconOnly = true }) {
  const [open, setOpen] = useState(false);
  const { presets, themeId, setThemeId } = useThemeManager();

  const currentName = useMemo(() => presets.find((p) => p.id === themeId)?.name || themeId, [presets, themeId]);

  return (
    <>
      {iconOnly ? (
        <IconButton color="inherit" onClick={() => setOpen(true)} title="Select Theme">
          <PaletteRoundedIcon />
        </IconButton>
      ) : (
        <Button startIcon={<PaletteRoundedIcon />} variant="outlined" onClick={() => setOpen(true)}>
          Theme
        </Button>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Theme</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ opacity: 0.75, mb: 1 }}>
            Current: <b>{currentName}</b>
          </Typography>
          <List disablePadding>
            {presets.map((p) => (
              <ListItemButton
                key={p.id}
                selected={p.id === themeId}
                onClick={() => setThemeId(p.id)}
                sx={{ borderRadius: 1 }}
              >
                <Radio checked={p.id === themeId} />
                <ListItemText primary={<Typography fontWeight={800}>{p.name}</Typography>} secondary={p.id} />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Stack direction="row" spacing={1} sx={{ px: 1, pb: 1 }}>
            <Button onClick={() => setThemeId("dark_glass")} variant="outlined">
              Reset default
            </Button>
            <Button onClick={() => setOpen(false)} variant="contained">
              Done
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}


