import { useState } from "react";
import { Link, useParams } from "react-router";
import SessionDetails from "./SessionDetails";
import Box from "../basic/Box";

export default function SessionViewer() {
  const [text, setText] = useState<string>("");
  const { sessionId } = useParams();

  if (sessionId) {
    return <SessionDetails sessionId={sessionId} expanded />;
  }
  return (
    <div className="grid grid-cols-1 p-2">
      <div className="flex flex-col gap-y-2">
        <Box className="p-2">
          <div className="mb-2">Enter a session id to view all the queries in it.</div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2">
              Session ID:
              <input
                type="text"
                className="input-main w-60 rounded px-2 py-1"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </label>{" "}
            <Link
              to={"/session/" + text}
              type="button"
              className="btn-main min-w-24 rounded-full px-2 py-1 text-center text-lg font-bold"
            >
              View
            </Link>
          </div>
        </Box>
      </div>
    </div>
  );
}
