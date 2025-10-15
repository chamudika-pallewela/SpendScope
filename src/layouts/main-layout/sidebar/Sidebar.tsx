import { Drawer, List, Toolbar } from '@mui/material';
import Logo from 'components/common/Logo';
import { menuLinks } from 'layouts/main-layout/sidebar/MenuLinks';
import MenuListItem from 'layouts/main-layout/sidebar/MenuListItem';
import SimpleBar from 'simplebar-react';
interface SidebarProps {
  drawerWidth: {
    lg: number;
    md: number;
    sm: number;
  };
  collapsed?: boolean;
  onToggle?: () => void;
}
const Sidebar = ({ drawerWidth, collapsed = false }: SidebarProps) => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: collapsed
            ? 80
            : {
                xs: drawerWidth.sm,
                lg: drawerWidth.md,
                xl: drawerWidth.lg,
              },
          transition: 'width 0.3s ease',
        },
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        gap: 2,
        py: 3.5,
        overflow: 'hidden',
        width: collapsed
          ? 80
          : {
              xs: drawerWidth.sm,
              lg: drawerWidth.md,
              xl: drawerWidth.lg,
            },
      }}
    >
      <Toolbar
        sx={{
          gap: 1,
          minHeight: 100,
          cursor: 'pointer',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        {collapsed ? (
          <img src="/bankdash.svg" alt="Logo" style={{ width: 32, height: 32 }} />
        ) : (
          <Logo />
        )}
      </Toolbar>

      <SimpleBar style={{ maxHeight: 'calc(100vh - 100px)' }}>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {menuLinks.map((menu) => (
            <MenuListItem key={menu.id} menuItem={menu} collapsed={collapsed} />
          ))}
        </List>
      </SimpleBar>
    </Drawer>
  );
};

export default Sidebar;
