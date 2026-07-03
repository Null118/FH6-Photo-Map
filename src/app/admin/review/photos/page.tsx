import Image from "next/image";
import Link from "next/link";

import { approvePhotoAction, deletePhotoAction } from "@/app/actions/location-actions";
import { ApproveButton } from "@/components/admin/approve-button";
import { DeleteButton } from "@/components/admin/delete-button";
import { requireAdminUser } from "@/lib/auth-server";
import { getPendingPhotosForAdmin } from "@/lib/data/locations";

export default async function AdminPhotoReviewPage() {
  await requireAdminUser();
  const photos = await getPendingPhotosForAdmin();

  return (
    <main className="admin-page">
      <section className="admin-list-header">
        <div>
          <p className="eyebrow">Admin / Review</p>
          <h1>照片审核</h1>
          <p className="lead">这里只显示待审核照片。已通过照片请到照片管理中查看或删除。</p>
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
                <span>地点：{photo.location.title}</span>
                <span>提交者：{photo.owner?.displayName ?? "未归属"}</span>
                <span>
                  坐标：{photo.location.x.toFixed(4)} / {photo.location.y.toFixed(4)}
                </span>
              </div>
              <div className="admin-action-row">
                <ApproveButton action={approvePhotoAction.bind(null, photo.id)} />
                <DeleteButton action={deletePhotoAction.bind(null, photo.id)} label="删除照片" />
                <Link href={`/admin/locations/${photo.locationId}`} className="secondary-link">
                  查看地点
                </Link>
              </div>
            </div>
          </article>
        ))}

        {photos.length === 0 ? (
          <article className="admin-list-card">
            <div>
              <h2>暂无待审核照片</h2>
              <p>新的照片投稿会出现在这里。</p>
            </div>
          </article>
        ) : null}
      </div>
    </main>
  );
}
