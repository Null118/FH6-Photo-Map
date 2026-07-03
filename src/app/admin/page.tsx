import Image from "next/image";
import Link from "next/link";

import { approveLocationAction, deleteLocationAction } from "@/app/actions/location-actions";
import { ApproveButton } from "@/components/admin/approve-button";
import { DeleteButton } from "@/components/admin/delete-button";
import { requireAdminUser } from "@/lib/auth-server";
import { db } from "@/lib/db";
import {
  getAdminReviewFilterLabel,
  getAdminReviewFilterWhere,
  normalizeAdminReviewFilter,
  reviewStatusText,
  type AdminReviewFilter,
} from "@/lib/review-status";

const reviewFilters: AdminReviewFilter[] = ["all", "pending", "reviewed"];

function getStatusClass(status: string) {
  if (status === "approved") {
    return "is-approved";
  }

  if (status === "pending") {
    return "is-pending";
  }

  return "is-muted";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await requireAdminUser();
  if (!session) {
    return null;
  }
  const params = await searchParams;
  const activeFilter = normalizeAdminReviewFilter(params.filter);

  const [locationCount, photoCount, publishedLocationCount, pendingLocationCount, pendingPhotoCount, locations] = await Promise.all([
    db.location.count(),
    db.photo.count(),
    db.location.count({ where: { isPublished: true } }),
    db.location.count({ where: { status: "pending" } }),
    db.photo.count({ where: { status: "pending" } }),
    db.location.findMany({
      where: getAdminReviewFilterWhere(activeFilter),
      include: {
        owner: true,
        photos: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);
  const metrics = [
    { label: "地点", value: locationCount },
    { label: "照片", value: photoCount },
    { label: "已发布地点", value: publishedLocationCount },
    { label: "待审地点", value: pendingLocationCount },
    { label: "待审照片", value: pendingPhotoCount },
  ];

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <Link href="/admin" className="admin-brand">
          <span className="admin-brand__mark">FH</span>
          <span>FH6 Photo Map - 管理中心</span>
        </Link>
        <div className="admin-user-chip">
          <span>当前管理员</span>
          <strong>{session.displayName}</strong>
        </div>
      </header>

      <section className="admin-console">
        <div className="admin-console__intro">
          <div>
            <p className="eyebrow">Console</p>
            <h1>内容审核</h1>
          </div>
          <p>查看地点、照片、提交者与审核状态。管理员只负责审批和删除，不修改用户提交的位置和参数。</p>
        </div>

        <dl className="admin-metric-strip">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd>{metric.value}</dd>
            </div>
          ))}
        </dl>

        <div className="admin-toolbar">
          <nav className="admin-filter-tabs" aria-label="地点审核筛选">
            {reviewFilters.map((filter) => (
              <Link
                key={filter}
                href={filter === "all" ? "/admin" : `/admin?filter=${filter}`}
                className={activeFilter === filter ? "is-active" : ""}
              >
                {getAdminReviewFilterLabel(filter)}
              </Link>
            ))}
          </nav>
          <div className="admin-toolbar__links">
            <Link href="/admin/photos">照片管理</Link>
            <Link href="/admin/review/photos">照片审核</Link>
          </div>
        </div>

        <section className="admin-review-table" aria-label="地点审核列表">
          <div className="admin-review-table__head">
            <span>预览</span>
            <span>地点信息</span>
            <span>坐标</span>
            <span>提交者</span>
            <span>状态</span>
            <span>操作</span>
          </div>

          {locations.map((location) => {
            const coverPhoto = location.photos[0];
            const approveAction = approveLocationAction.bind(null, location.id);
            const deleteAction = deleteLocationAction.bind(null, location.id);

            return (
              <article className="admin-review-row" key={location.id}>
                <div className="admin-review-row__preview">
                  {coverPhoto ? (
                    <Image
                      src={coverPhoto.imagePath}
                      alt={coverPhoto.title}
                      fill
                      sizes="112px"
                      className="admin-review-row__image"
                    />
                  ) : (
                    <span>无图</span>
                  )}
                </div>

                <div className="admin-review-row__main">
                  <h2>{location.title}</h2>
                  <p>{location.description || "暂无简介"}</p>
                  <span>{location.photos.length} 张照片</span>
                </div>

                <div className="admin-review-row__meta">
                  <span>{location.x.toFixed(4)}</span>
                  <span>{location.y.toFixed(4)}</span>
                </div>

                <div className="admin-review-row__submitter">
                  <strong>{location.owner?.displayName ?? "未归属"}</strong>
                  <span>{location.owner?.username ?? "unknown"}</span>
                </div>

                <div>
                  <span className={`admin-status-pill ${getStatusClass(location.status)}`}>
                    {reviewStatusText[location.status]}
                  </span>
                </div>

                <div className="admin-review-row__actions">
                  <Link href={`/admin/locations/${location.id}`} className="secondary-link">
                    查看
                  </Link>
                  {location.status === "pending" ? <ApproveButton action={approveAction} /> : null}
                  <DeleteButton action={deleteAction} label="删除" />
                </div>
              </article>
            );
          })}

          {locations.length === 0 ? (
            <article className="admin-empty-row">
              <h2>没有符合条件的标点</h2>
              <p>切换筛选条件，或等待用户提交新的地点。</p>
            </article>
          ) : null}
        </section>
      </section>
    </main>
  );
}
