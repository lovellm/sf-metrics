import { appVersionBuild } from "../../constants";

const year = new Date().getUTCFullYear();

export default function Footer() {
  return (
    <footer className="absolute bottom-0 flex h-6 w-full flex-row flex-nowrap items-center justify-between border-t border-zinc-600 bg-white px-4 text-xs text-zinc-400 dark:border-zinc-600 dark:bg-neutral-900">
      <div>{year}</div>
      <div className="text-center">&nbsp;</div>
      <div>Version {appVersionBuild}</div>
    </footer>
  );
}
