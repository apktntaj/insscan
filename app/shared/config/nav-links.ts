/**
 * Navigation Links Configuration
 * Presentation Layer - Config
 */

export interface NavLink {
  id: number;
  label: string;
  href: string;
}

export const navLinks: NavLink[] = [
  {
    id: 1,
    label: "Cek Lartas",
    href: "/cek-lartas",
  },
  {
    id: 2,
    label: "Shipment",
    href: "/shipments",
  },
  {
    id: 3,
    label: "Latihan",
    href: "/exercise",
  },
  {
    id: 4,
    label: "Dukung",
    href: "/feedback",
  },
];
