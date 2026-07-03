import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getLocationDetail } from "@/lib/data/locations";
import type { CustomMetaRow } from "@/types";

function isCustomMetaRowArray(value: unknown): value is CustomMetaRow[] {
  return Array.isArray(value);
}

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const location = await getLocationDetail(id);

  if (!location) {
    notFound();
  }

  return (
    <main className="detail-page">
      <section className="detail-header">
        <div>
          <p className="eyebrow">Location Detail</p>
          <h1>{location.title}</h1>
          <p className="lead">{location.description || "这个地点还没有补充简介。"}</p>
        </div>
        <Link href="/" className="secondary-link">
          返回地图
        </Link>
      </section>

      <section className="photo-grid">
        {location.photos.map((photo) => {
          const customMeta = isCustomMetaRowArray(photo.customMeta) ? photo.customMeta : [];

          return (
            <article className="photo-card" key={photo.id}>
              <div className="photo-image-wrap">
                <Image
                  src={photo.imagePath}
                  alt={photo.title}
                  fill
                  className="detail-image"
                  sizes="(max-width: 720px) 100vw, 50vw"
                />
              </div>
              <div className="photo-card__body">
                <h2>{photo.title}</h2>
                <p>{photo.description || "这张照片还没有补充说明。"}</p>
                <dl className="meta-grid">
                  <div>
                    <dt>机身</dt>
                    <dd>{photo.cameraBody || "-"}</dd>
                  </div>
                  <div>
                    <dt>镜头</dt>
                    <dd>{photo.lens || "-"}</dd>
                  </div>
                  <div>
                    <dt>焦距</dt>
                    <dd>{photo.focalLength || "-"}</dd>
                  </div>
                  <div>
                    <dt>光圈</dt>
                    <dd>{photo.aperture || "-"}</dd>
                  </div>
                  <div>
                    <dt>快门</dt>
                    <dd>{photo.shutterSpeed || "-"}</dd>
                  </div>
                  <div>
                    <dt>ISO</dt>
                    <dd>{photo.iso || "-"}</dd>
                  </div>
                </dl>
                {customMeta.length > 0 ? (
                  <ul className="custom-meta-list">
                    {customMeta.map((item) => (
                      <li key={`${photo.id}-${item.key}`}>
                        <strong>{item.key}:</strong> {item.value}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
