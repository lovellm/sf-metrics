import { isRouteErrorResponse, useRouteError } from "react-router";
import { Footer, Header, Menu, NavBar } from "@spcs-apps/page-parts";
import MenuContent from "../menu/MenuContent";
import { navOptions } from "../menu/navOptions";

export function ErrorPage() {
  const error = useRouteError();

  let errorMessage: React.ReactNode = "Unknown Error";

  if (isRouteErrorResponse(error)) {
    errorMessage = (
      <>
        <h1 className="text-2xl">
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </>
    );
  } else if (error instanceof Error) {
    errorMessage = (
      <div>
        <h1 className="text-2xl">An Error has Occurred</h1>
        <p>{error.message}</p>
        <h2 className="mt-4 text-lg">This is likely a bug in the application.</h2>
        <p className="mt-4">The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  }
  return (
    <>
      <Header />
      <NavBar options={navOptions} />
      <main className="relative mb-6 p-8 text-center">{errorMessage}</main>
      <Menu>
        <MenuContent />
      </Menu>
      <Footer />
    </>
  );
}
