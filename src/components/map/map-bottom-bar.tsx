import Link from "next/link";

type BottomBarItem = {
  id: string;
  label: string;
  href: string;
};

type MapBottomBarProps = {
  items: BottomBarItem[];
};

export function MapBottomBar({ items }: MapBottomBarProps) {
  return (
    <nav className="map-bottom-bar" aria-label="Map utility actions">
      {items.map((item) => (
        <Link key={item.id} href={item.href} className="map-bottom-bar__item">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
