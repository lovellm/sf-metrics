import { isRouteErrorResponse, useRouteError } from "react-router";
import Header from "./Header";
import NavBar from "../menu/NavBar";
import Menu from "../menu/Menu";
import Footer from "./Footer";

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
      <NavBar />
      <main className="relative mb-6 p-8 text-center">{errorMessage}</main>
      <Menu />
      <Footer />
    </>
  );
}
