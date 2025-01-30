import { ConfigProvider as AntConfigProvider, theme } from 'antd';

function AppConfigProvider({ children }) {
  // For now, we'll use a dark theme by default, but we can add theme switching later
  const isDark = true;

  return (
    <AntConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#624bad', // light blueish purple
          borderRadius: 9,
          colorText: '#ffffff',
          colorTextSecondary: '#e0e0e0',
          colorTextTertiary: '#a0a0a0',
          colorBgContainer: '#141414',
          colorBgElevated: '#1f1f1f',
          colorBorder: '#2a2a2a',
          fontFamily: "'Montserrat', 'Roboto', sans-serif",
        },
        components: {
          Menu: {
            itemBg: 'transparent',
            subMenuItemBg: 'transparent',
            itemColor: '#e0e0e0',
            itemHoverColor: '#ffffff',
            itemSelectedColor: '#ffffff',
            itemHoverBg: '#1f1f1f',
            itemSelectedBg: '#1f1f1f',
          },
          Input: {
            colorBgContainer: '#0a0a0a',
            colorBorder: '#2a2a2a',
            colorText: '#ffffff',
            colorTextPlaceholder: '#a0a0a0',
          },
          Select: {
            colorBgContainer: '#0a0a0a',
            colorBorder: '#2a2a2a',
            colorText: '#ffffff',
            colorTextPlaceholder: '#a0a0a0',
            colorBgElevated: '#141414',
          },
          Button: {
            colorBgContainer: '#1f1f1f',
            colorBorder: '#2a2a2a',
            colorText: '#ffffff',
          },
          Modal: {
            colorBgElevated: '#141414',
            colorBgMask: 'rgba(0, 0, 0, 0.8)',
          },
          Card: {
            colorBgContainer: '#141414',
            colorBorderSecondary: '#2a2a2a',
          },
          Typography: {
            colorText: '#ffffff',
            colorTextSecondary: '#e0e0e0',
            colorTextTertiary: '#a0a0a0',
          },
          Dropdown: {
            colorBgElevated: '#141414',
            colorText: '#ffffff',
            controlItemBgHover: '#1f1f1f',
            colorTextDescription: '#e0e0e0',
            menuItemSelectedBg: '#1f1f1f',
            colorBgTextHover: '#1f1f1f',
            colorBgTextActive: '#1f1f1f',
            itemColor: '#ffffff',
            itemHoverColor: '#ffffff',
            itemSelectedColor: '#ffffff',
          },
          Layout: {
            bodyBg: '#0a0a0a',
            headerBg: '#141414',
            triggerBg: '#1f1f1f',
            siderBg: '#141414',
          },
          Drawer: {
            colorBgElevated: '#141414',
            colorText: '#ffffff',
          },
          Message: {
            colorBgElevated: '#1f1f1f',
            colorText: 'rgba(255, 255, 255, 0.85)',
            colorSuccess: '#52c41a',
            colorError: '#ff4d4f',
            colorWarning: '#faad14',
            colorInfo: '#1677ff'
          }
        }
      }}
    >
      {children}
    </AntConfigProvider>
  );
}

export default AppConfigProvider; 