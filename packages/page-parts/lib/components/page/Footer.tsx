const year = new Date().getUTCFullYear();

interface FooterProps {
  version?: string;
}

export default function Footer({ version }: FooterProps) {
  return (
    <footer className="border-main bg-primary-dark dark:bg-primary-dark text-darkGray dark:border-darkGray absolute bottom-0 flex h-6 w-full flex-row flex-nowrap items-center justify-between border-t px-4 text-xs">
      <div>{year}</div>
      <div className="text-center"> </div>
      <div>Version {version || "?"}</div>
    </footer>
  );
}
