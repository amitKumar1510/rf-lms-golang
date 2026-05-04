import { useNavigate, useOutletContext } from "react-router-dom";
import SettingsTab from "./tabs/SettingsTab";

export default function SubadminSettingsPage() {
  const navigate = useNavigate();
  const { me, setMe } = useOutletContext();

  return <SettingsTab me={me} onUpdated={setMe} onBack={() => navigate("/subadmin/dashboard")} />;
}
