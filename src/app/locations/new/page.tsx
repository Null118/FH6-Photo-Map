import { LocationCreateForm } from "@/components/forms/location-create-form";
import { requireLoggedInUser } from "@/lib/auth-server";

export default async function NewLocationPage({
  searchParams,
}: {
  searchParams: Promise<{ x?: string; y?: string }>;
}) {
  await requireLoggedInUser();

  const params = await searchParams;
  const x = params.x ?? "0";
  const y = params.y ?? "0";

  return (
    <main className="form-page">
      <section className="form-panel">
        <p className="eyebrow">Create Location</p>
        <h1>上传照片并填写拍摄参数</h1>
        <p className="lead">标点已经从首页地图带入。提交后会进入待审核状态，审核通过后才会公开显示。</p>
        <LocationCreateForm x={x} y={y} />
      </section>
    </main>
  );
}
