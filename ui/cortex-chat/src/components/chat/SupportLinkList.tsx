import { SupportLinks } from "@/constants";

interface SupportLinksProps {
  supportLinks: SupportLinks;
}

export default function SupportLinkList({ supportLinks }: SupportLinksProps) {
  return (
    <div>
      <div className="font-bold">{supportLinks.title}</div>
      <div className="mt-2 flex flex-wrap gap-4">
        {supportLinks.links?.map((link) => {
          if (!link.href) {
            return undefined;
          }
          return (
            <a
              key={link.href}
              href={link.href}
              title={link.name}
              className="btn-main inline-block rounded-full px-3 py-1"
              target="_blank"
              rel="noreferrer"
            >
              {link.name}
            </a>
          );
        })}
      </div>
    </div>
  );
}
