import Link from "next/link";

import { deleteLocationAction } from "@/app/actions/location-actions";
import { DeleteButton } from "@/components/admin/delete-button";
import { requireAdminUser } from "@/lib/auth-server";
import { getAllLocationsForAdmin } from "@/lib/data/locations";
import { reviewStatusText } from "@/lib/review-status";

export default async function AdminLocationsPage() {
  await requireAdminUser();
  const locations = await getAllLocationsForAdmin();

  return (
    <main className="admin-page">
      <section className="admin-list-header">
        <div>
          <p className="eyebrow">Admin / Locations</p>
          <h1>地点管理</h1>
        </div>
        <Link href="/admin" className="secondary-link">
          返回总览
        </Link>
      </section>
      <div className="admin-list">
        {locations.map((location) => (
          <article className="admin-list-card" key={location.id}>
            <div>
              <h2>{location.title}</h2>
              <p>{location.description || "暂无简介"}</p>
            </div>
            <div className="admin-list-meta">
              <span>{reviewStatusText[location.status]}</span>
              <span>提交者：{location.owner?.displayName ?? "未归属"}</span>
              <span>
                坐标：{location.x.toFixed(4)} / {location.y.toFixed(4)}
              </span>
              <span>{location.photos.length} 张照片</span>
              <Link href={`/admin/locations/${location.id}`}>查看详情</Link>
              <DeleteButton action={deleteLocationAction.bind(null, location.id)} label="删除地点" />
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
