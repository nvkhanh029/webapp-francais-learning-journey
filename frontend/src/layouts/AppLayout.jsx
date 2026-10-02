import { Outlet } from "react-router-dom";

import NavigationBar from "../components/navigation/NavigationBar.jsx";
import SiteFooter from "../components/navigation/SiteFooter.jsx";
import styles from "./AppLayout.module.css";

// Frame of the authenticated application (FD §4.3, §7.6): header, routed page, footer.
export default function AppLayout() {
  return (
    <div className={`app-page ${styles.layout}`}>
      <NavigationBar />
      <div className="page-body">
        <Outlet />
      </div>
      <SiteFooter />
    </div>
  );
}
