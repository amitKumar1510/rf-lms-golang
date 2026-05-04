import { useOutletContext } from "react-router-dom";
import OverviewTab from "./tabs/OverviewTab";

export default function SubadminDashboard() {
  const { me } = useOutletContext();
  return <OverviewTab me={me} />;
}
