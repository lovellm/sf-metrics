import MenuButton from "../menu/MenuButton";
import Logo from "./Logo";

interface HeaderProps {
  children?: React.ReactNode;
  appTitle?: string;
}

export default function Header({ children, appTitle }: HeaderProps) {
  return (
    <header className="border-main flex flex-wrap items-center justify-between gap-x-4 border-b bg-white py-0 pr-4 pl-4 dark:bg-transparent">
      <div className="flex items-center gap-12 shrink-0">
        <Logo appTitle={appTitle} />
      </div>
      <div className="flex items-center grow shrink flex-wrap">{children}</div>
      <div className="shrink-0">
        <MenuButton />
      </div>
    </header>
  );
}
