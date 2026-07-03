import Image from "next/image";
import Link from "next/link";

import { deletePhotoAction } from "@/app/actions/location-actions";
import { DeleteButton } from "@/components/admin/delete-button";
import { requireAdminUser } from "@/lib/auth-server";
import { getAllPhotosForAdmin } from "@/lib/data/locations";
import { reviewStatusText } from "@/lib/review-status";

export default async function AdminPhotosPage() {
  await requireAdminUser();
  const photos = await getAllPhotosForAdmin();

  return (
    <main className="admin-page">
      <section className="admin-list-header">
        <div>
          <p className="eyebrow">Admin / Photos</p>
          <h1>照片管理</h1>
        </div>
        <Link href="/admin" className="secondary-link">
          返回总览
        </Link>
      </section>
      <div className="admin-photo-grid">
        {photos.map((photo) => (
          <article className="admin-photo-card" key={photo.id}>
            <div className="admin-photo-preview">
              <Image src={photo.imagePath} alt={photo.title} fill sizes="320px" className="detail-image" />
            </div>
            <div className="admin-photo-card__body">
              <h2>{photo.title}</h2>
              <p>{photo.description || "暂无描述"}</p>
              <div className="admin-list-meta">
                <span>{reviewStatusText[photo.status]}</span>
                <span>地点：{photo.location.title}</span>
                <span>
                  坐标：{photo.location.x.toFixed(4)} / {photo.location.y.toFixed(4)}
                </span>
              </div>
              <div className="admin-list-meta">
              <span>提交者：{photo.owner?.displayName ?? "未归属"}</span>
                {photo.isPublished ? <Link href={`/locations/${photo.locationId}`}>查看前台</Link> : null}
                <Link href={`/admin/locations/${photo.locationId}`}>查看地点</Link>
                <DeleteButton action={deletePhotoAction.bind(null, photo.id)} label="删除照片" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
