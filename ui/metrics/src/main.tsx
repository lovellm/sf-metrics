import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppStateProvider } from "./context/AppStateProvider.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import { ErrorPage } from "./components/page/ErrorPage.tsx";
import WarehouseScaling from "./components/page/WarehouseScaling.tsx";
import Home from "./components/page/Home.tsx";
import Cortex from "./components/page/Cortex.tsx";
import UserMetrics from "./components/page/UserMetrics.tsx";
import DynamicTables from "./components/page/DynamicTables.tsx";
import Storage from "./components/page/Storage.tsx";
import Tasks from "./components/page/Tasks.tsx";
import HybridTables from "./components/page/HybridTables.tsx";
import AllCredits from "./components/page/AllCredits.tsx";
import MaterializedViews from "./components/page/MaterializedViews.tsx";
import ComputePools from "./components/page/ComputePools.tsx";
import AutoCluster from "./components/page/AutoCluster.tsx";
import SessionViewer from "./components/session/SessionViewer.tsx";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <Home />,
        },
        {
          path: "user",
          element: <UserMetrics />,
        },
        {
          path: "tasks",
          element: <Tasks />,
        },
        {
          path: "dynamictables",
          element: <DynamicTables />,
        },
        {
          path: "storage",
          element: <Storage />,
        },
        {
          path: "scaling",
          element: <WarehouseScaling />,
        },
        {
          path: "ai",
          element: <Cortex />,
        },
        { path: "hybridtables", element: <HybridTables /> },
        { path: "allcredits", element: <AllCredits /> },
        { path: "materializedviews", element: <MaterializedViews /> },
        { path: "computepools", element: <ComputePools /> },
        { path: "autocluster", element: <AutoCluster /> },
        { path: "session/:sessionId?", element: <SessionViewer /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppStateProvider>
      <RouterProvider router={router} />
    </AppStateProvider>
  </StrictMode>,
);
