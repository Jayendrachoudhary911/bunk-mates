// src/components/ResponsiveLayout.jsx
import React from "react";
import DesktopWorkspace from "./DesktopWorkspace";

/**
 * ResponsiveLayout wraps the primary application workspace,
 * rendering the Desktop-first layered multi-panel architecture
 * on desktop while preserving the clean mobile experience on phones.
 */
const ResponsiveLayout = ({ children }) => {
  return <DesktopWorkspace>{children}</DesktopWorkspace>;
};

export default ResponsiveLayout;
