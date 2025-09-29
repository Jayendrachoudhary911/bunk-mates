<Collapse in={Boolean(replyTo)} timeout={300}>
  {replyTo && (
    <Paper
      sx={{
        mb: 1.2,
        p: 1.2,
        px: 1.6,
        borderRadius: "14px",
        background:
          effectiveChatTheme === "dark"
            ? "linear-gradient(145deg, #1c1c1c20, #10101030)"
            : "linear-gradient(145deg, #ffffff2c, #f7f7f73c)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backdropFilter: "blur(12px)",
        boxShadow: "none",
      }}
      >
      <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Box>
          <Typography variant="caption" color="primary">
            {replyTo.senderName === currentUser.uid ? 'You' : replyTo.senderName}
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc' }}>
            {replyTo.text.length > 60
              ? replyTo.text.slice(0, 60) + '...'
              : replyTo.text}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          size="small"
          onClick={() => setReplyTo(null)}
          sx={{
            bgcolor: effectiveChatTheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
            color: effectiveChatTheme === "dark" ? "#fff" : "#333",
            width: 26,
            height: 26,
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: effectiveChatTheme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
              transform: "scale(1.1)",
            },
          }}
        >
          <CloseIcon sx={{ fontSize: "16px" }} />
        </IconButton>
      </Box>
    </Paper>
  )}
</Collapse>