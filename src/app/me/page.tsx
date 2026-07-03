import { OwnerMapCanvas } from "@/components/map/owner-map-canvas";
import { requireLoggedInUser } from "@/lib/auth-server";
import { getLocationsForOwner } from "@/lib/data/locations";
import { buildOwnerMapStats, getOwnerMarkerVariant, getOwnerStatusLabel } from "@/lib/me-map";

export default async function MyImagesPage() {
  const session = await requireLoggedInUser();
  const locations = await getLocationsForOwner(session.userId);
  const stats = buildOwnerMapStats(locations);
  const mapLocations = locations.map((location) => ({
    id: location.id,
    title: location.title,
    x: location.x,
    y: location.y,
    isPublished: location.isPublished,
    status: location.status,
    coverImagePath: location.photos[0]?.imagePath ?? null,
    photoCount: location.photos.length,
    markerVariant: getOwnerMarkerVariant(location.status),
    statusLabel: getOwnerStatusLabel(location.status),
  }));

  return (
    <main className="home-page">
      <OwnerMapCanvas locations={mapLocations} stats={stats} />
    </main>
  );
}
