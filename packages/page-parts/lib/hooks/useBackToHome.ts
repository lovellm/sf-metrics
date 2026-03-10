import { useCallback } from "react";
import { useNavigate } from "react-router";
import usePageState from "../context/usePageState";

/** Returns a function that when called will navigate back to home page (/) */
export default function useBackToHome() {
  const [, dispatch] = usePageState();
  const navigate = useNavigate();

  const backToHome = useCallback(() => {
    dispatch({ type: "setIsMenuOpen", payload: false });
    navigate("/")?.catch((e) => {
      console.error("unexpected error useBackToHome", e);
    });
  }, [navigate, dispatch]);

  return backToHome;
}
