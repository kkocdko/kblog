/// <reference path="types/index.d.ts" />

const { useState } = React;
const {
  Button,
  ButtonGroup,
  AppBar,
  Toolbar,
  Typography,
  Grid,
  Paper,
  Container,
  ThemeProvider,
  Box,
  Stack,
  createTheme,
  MenuIcon,
  IconButton,
  Icon,
} = MaterialUI;

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
      <Box
        sx={{
          position: "fixed",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          top: 0,
          left: 0,
          backgroundColor: ({ palette }) => palette.background.default,
        }}
      >
        <AppBar position="relative">
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              sx={{ ml: -1, mr: 2 }}
            >
              <Icon>menu</Icon>
            </IconButton>
            CONVEVO
          </Toolbar>
        </AppBar>
        <Grid>
          <Paper sx={{ m: 2, p: 2 }}>
            <Stack direction="row" spacing={1}>
              <Button>One</Button>
              <Button>Two</Button>
              <Button>Three</Button>
            </Stack>
          </Paper>
        </Grid>
      </Box>
    </ThemeProvider>
  </React.StrictMode>,
  document.body.appendChild(document.createElement("main"))
);

// miniserve --header Cache-Control:max-age=1 -p 9090 .
