// import "@spcs-apps/data-utils/dist/assets/data-utils.css";
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { PageStateProvider } from "@spcs-apps/page-parts";
import App from "./App.tsx";
import { ErrorPage } from "./components/ErrorPage.tsx";
import ChatPage from "./components/ChatPage.tsx";
import AdminPage from "./components/AdminPage.tsx";
import { AppStateProvider } from "./context/AppStateProvider.tsx";
import { localUserOverride } from "@spcs-apps/data-utils";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <ChatPage />,
        },
        {
          path: "admin",
          element: <AdminPage />,
        },
        { path: ":configId", element: <ChatPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageStateProvider>
      <AppStateProvider>
        <RouterProvider router={router} />
      </AppStateProvider>
    </PageStateProvider>
  </StrictMode>,
);

// for local development, override user api call
if (import.meta.env.DEV) {
  localUserOverride("LOCAL_DEV", ["ADMIN_ROLE_HERE"]);
}
