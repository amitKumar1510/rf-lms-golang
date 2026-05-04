import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

export function SectionTitle({ title, subtitle, action }) {
  return (
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} className="mb-4 flex-wrap gap-4">
      <Box className="min-w-0">
        <Typography variant="h6" fontWeight={600} className="font-inherit text-[1rem] leading-tight md:text-[1.05rem]">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" className="mt-1 text-sm text-slate-400">
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Stack>
  );
}

export function Panel({ children, sx }) {
  return (
    <Card
      elevation={0}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_18px_50px_rgba(2,6,23,0.28)] backdrop-blur-xl"
      sx={sx}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.08),rgba(14,165,233,0.04)_45%,transparent_100%)]" />
      {children}
    </Card>
  );
}
