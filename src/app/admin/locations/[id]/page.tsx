import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteLocationAction, deletePhotoAction } from "@/app/actions/location-actions";
import { DeleteButton } from "@/components/admin/delete-button";
import { requireAdminUser } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { reviewStatusText } from "@/lib/review-status";

function formatOptional(value: string | null) {
  return value && value.trim() ? value : "未填写";
}

export default async function AdminLocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminUser();

  const { id } = await params;
  const location = await db.location.findUnique({
    where: { id },
    include: {
      owner: true,
      photos: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!location) {
    notFound();
  }

  const deleteAction = deleteLocationAction.bind(null, location.id);

  return (
    <main className="admin-page">
      <section className="admin-list-header">
        <div>
          <p className="eyebrow">Admin / Location Detail</p>
          <h1>{location.title}</h1>
          <p className="lead">{location.description || "暂无简介"}</p>
        </div>
        <Link href="/admin/locations" className="secondary-link">
          返回列表
        </Link>
      </section>

      <section className="admin-list-card">
        <div>
          <h2>地点信息</h2>
          <p>提交者：{location.owner?.displayName ?? "未归属"}</p>
        </div>
        <div className="admin-list-meta">
          <span>{reviewStatusText[location.status]}</span>
          <span>
            坐标：{location.x.toFixed(4)} / {location.y.toFixed(4)}
          </span>
        </div>
      </section>

      <div className="admin-action-row">
        <DeleteButton action={deleteAction} label="删除地点" />
      </div>

      <section className="admin-photo-table">
        <h2>关联照片与拍摄参数</h2>
        <ul>
          {location.photos.map((photo) => (
            <li key={photo.id}>
              <div className="admin-photo-thumb">
                <Image src={photo.imagePath} alt={photo.title} fill sizes="220px" className="detail-image" />
              </div>
              <div>
                <strong>{photo.title}</strong>
                <p>{photo.description || "暂无描述"}</p>
                <dl className="admin-photo-meta">
                  <div>
                    <dt>机身</dt>
                    <dd>{formatOptional(photo.cameraBody)}</dd>
                  </div>
                  <div>
                    <dt>镜头</dt>
                    <dd>{formatOptional(photo.lens)}</dd>
                  </div>
                  <div>
                    <dt>焦距</dt>
                    <dd>{formatOptional(photo.focalLength)}</dd>
                  </div>
                  <div>
                    <dt>光圈</dt>
                    <dd>{formatOptional(photo.aperture)}</dd>
                  </div>
                  <div>
                    <dt>快门</dt>
                    <dd>{formatOptional(photo.shutterSpeed)}</dd>
                  </div>
                  <div>
                    <dt>ISO</dt>
                    <dd>{formatOptional(photo.iso)}</dd>
                  </div>
                </dl>
              </div>
              <div className="admin-list-meta">
                <span>{reviewStatusText[photo.status]}</span>
                <DeleteButton action={deletePhotoAction.bind(null, photo.id)} label="删除照片" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
