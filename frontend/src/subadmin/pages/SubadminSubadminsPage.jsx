import { useOutletContext } from "react-router-dom";
import SubadminsTab from "./tabs/SubadminsTab";

export default function SubadminSubadminsPage() {
  const { schoolId } = useOutletContext();
  return <SubadminsTab schoolId={schoolId} />;
}
