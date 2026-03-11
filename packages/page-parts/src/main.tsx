import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import App from "./App.tsx";
import { PageStateProvider } from "../lib/context/PageStateProvider.tsx";
import { ErrorPage } from "./ErrorPage.tsx";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      errorElement: <ErrorPage />,
    },
  ],
  { basename: import.meta.env.BASE_URL },
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageStateProvider>
      <RouterProvider router={router} />
    </PageStateProvider>
  </StrictMode>,
);
