// src/utils/menuUtils.js
export const normalizeMenuData = (menuData) => {
  return menuData.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      // Ensure consistent submenu structure
      submenu: item.submenu || null,
      // Set default icon if missing
      icon: item.icon || "bx bx-category"
    }))
  }));
};
