import useConfigs from "@/hooks/useConfigs";
import { Box } from "@spcs-apps/page-parts";
import { Link } from "react-router";

export default function ConfigLinks() {
  const { configs } = useConfigs();

  return (
    <div className="m-3 grid grid-cols-1 items-center justify-items-center gap-y-3">
      <Box className="p-4 xl:w-4/5">
        No App Valid Configuration Provided. Select One
        <div className="list">
          <ul className="my-2 list-inside list-disc">
            {configs.map(
              (config) =>
                config.appId && (
                  <li key={config.appId}>
                    <Link className="a-main" to={config.appId.toLowerCase()}>
                      {config.appTitle}
                    </Link>
                  </li>
                ),
            )}
          </ul>
        </div>
      </Box>
    </div>
  );
}
