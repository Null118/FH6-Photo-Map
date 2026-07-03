import { MapCanvas } from "@/components/map/map-canvas";
import { getCurrentSession } from "@/lib/auth-server";
import { getPublishedMapLocations } from "@/lib/data/locations";

export default async function HomePage() {
  const [locations, session] = await Promise.all([getPublishedMapLocations(), getCurrentSession()]);

  return (
    <main className="home-page">
      <MapCanvas locations={locations} session={session} />
    </main>
  );
}
