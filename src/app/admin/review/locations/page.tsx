import Link from "next/link";

import { approveLocationAction, deleteLocationAction } from "@/app/actions/location-actions";
import { ApproveButton } from "@/components/admin/approve-button";
import { DeleteButton } from "@/components/admin/delete-button";
import { requireAdminUser } from "@/lib/auth-server";
import { getPendingLocationsForAdmin } from "@/lib/data/locations";

export default async function AdminLocationReviewPage() {
  await requireAdminUser();
  const locations = await getPendingLocationsForAdmin();

  return (
    <main className="admin-page">
      <section className="admin-list-header">
        <div>
          <p className="eyebrow">Admin / Review</p>
          <h1>地点审核</h1>
          <p className="lead">这里只显示待审核地点。已通过地点请到地点管理中查看或删除。</p>
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
              <span>提交者：{location.owner?.displayName ?? "未归属"}</span>
              <span>
                坐标：{location.x.toFixed(4)} / {location.y.toFixed(4)}
              </span>
              <span>{location.photos.length} 张照片</span>
              <Link href={`/admin/locations/${location.id}`}>查看详情</Link>
              <ApproveButton action={approveLocationAction.bind(null, location.id)} />
              <DeleteButton action={deleteLocationAction.bind(null, location.id)} label="删除地点" />
            </div>
          </article>
        ))}

        {locations.length === 0 ? (
          <article className="admin-list-card">
            <div>
              <h2>暂无待审核地点</h2>
              <p>新的用户投稿地点会出现在这里。</p>
            </div>
          </article>
        ) : null}
      </div>
    </main>
  );
}
