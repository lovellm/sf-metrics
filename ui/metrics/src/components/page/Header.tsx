import MenuButton from "../menu/MenuButton";
import Logo from "./Logo";

export default function Header() {
  return (
    <header className="border-main flex flex-wrap items-center justify-between gap-x-4 border-b bg-white py-0 pr-4 pl-4 dark:bg-neutral-900">
      <div className="flex items-center gap-12">
        <Logo />
        <div></div>
      </div>
      <div>
        <MenuButton />
      </div>
    </header>
  );
}
