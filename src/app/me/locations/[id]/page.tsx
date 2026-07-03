import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LocationEditForm } from "@/components/forms/location-edit-form";
import { requireLoggedInUser } from "@/lib/auth-server";
import { getEditableLocationForOwner } from "@/lib/data/locations";
import { reviewStatusText } from "@/lib/review-status";

export default async function MyLocationEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireLoggedInUser();
  const { id } = await params;
  const location = await getEditableLocationForOwner(id, session.userId);

  if (!location) {
    notFound();
  }

  return (
    <main className="form-page">
      <section className="form-panel">
        <div className="edit-page-header">
          <div>
            <p className="eyebrow">Edit Location</p>
            <h1>{location.title}</h1>
            <p className="lead">
              当前状态：{reviewStatusText[location.status]}。修改保存后会重新进入待审核，不会改变这个标点的位置。
            </p>
          </div>
          <div className="admin-list-meta">
            {location.isPublished ? <Link href={`/locations/${location.id}`}>查看公开页</Link> : null}
            <Link href="/me" className="secondary-link">
              返回我的地图
            </Link>
          </div>
        </div>

        {location.photos.length > 0 ? (
          <div className="edit-photo-preview-strip" aria-label="当前照片预览">
            {location.photos.map((photo) => (
              <article className="edit-photo-preview" key={photo.id}>
                <div className="edit-photo-preview__image">
                  <Image
                    src={photo.imagePath}
                    alt={photo.title}
                    fill
                    sizes="180px"
                    className="edit-photo-preview__img"
                  />
                </div>
                <div>
                  <strong>{photo.title}</strong>
                  <span>{reviewStatusText[photo.status]}</span>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <LocationEditForm location={location} />
      </section>
    </main>
  );
}
