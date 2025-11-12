import VtexVentas from "./components/VtexVentas";
import DashboardVTEX from "./components/DashboardVTEX";
import DashboardSocialSelling from "./components/DashboardSocialSelling";
export default function Page() {
  return (
    <main>
      <DashboardVTEX />
      <DashboardSocialSelling />
      <VtexVentas />
    </main>
  );
}
