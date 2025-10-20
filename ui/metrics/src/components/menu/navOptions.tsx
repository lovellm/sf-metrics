import { IoBarChart, IoHomeOutline } from "react-icons/io5";
import {
  PiBrain,
  PiClockClockwise,
  PiCpuFill,
  PiCurrencyDollarBold,
  PiDatabase,
  PiPuzzlePiece,
  PiScales,
  PiTable,
  PiTicket,
} from "react-icons/pi";

interface NavOptions {
  to: string;
  content: string;
  icon?: React.ReactNode;
  role?: string;
  showOnBar?: boolean;
}

export const navOptions: NavOptions[] = [
  { to: "/", content: "Home", icon: <IoHomeOutline />, showOnBar: true },
  { to: "/user", content: "User Metrics", icon: <IoBarChart />, showOnBar: true },
  {
    to: "/tasks",
    content: "Tasks",
    icon: <PiClockClockwise />,
    showOnBar: true,
  },
  {
    to: "/dynamictables",
    content: "Dynamic Tables",
    icon: <PiTable />,
    showOnBar: true,
  },
  {
    to: "/storage",
    content: "Storage Cost",
    icon: <PiDatabase />,
    showOnBar: true,
  },
  {
    to: "/hybridtables",
    content: "Hybrid Tables",
    icon: <PiDatabase />,
  },
  {
    to: "/materializedviews",
    content: "Materialized Views",
    icon: <PiTable />,
  },
  {
    to: "/ai",
    content: "Cortex AI",
    icon: <PiBrain />,
  },
  {
    to: "/autocluster",
    content: "Automatic Clustering",
    icon: <PiPuzzlePiece />,
  },
  {
    to: "/scaling",
    content: "Warehouse Scaling",
    icon: <PiScales />,
  },
  {
    to: "/computepools",
    content: "Compute Pools",
    icon: <PiCpuFill />,
  },
  {
    to: "/allcredits",
    content: "All Credits",
    icon: <PiCurrencyDollarBold />,
  },
  {
    to: "/session",
    content: "Session Viewer",
    icon: <PiTicket />,
  },
];
