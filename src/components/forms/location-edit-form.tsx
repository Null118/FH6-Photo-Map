import { updateOwnedLocationAction } from "@/app/actions/location-actions";
import type { CustomMetaRow, ReviewStatus } from "@/types";

type EditablePhoto = {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  status: ReviewStatus;
  cameraBody: string | null;
  lens: string | null;
  focalLength: string | null;
  aperture: string | null;
  shutterSpeed: string | null;
  iso: string | null;
  shotAt: Date | null;
  customMeta: unknown;
};

type LocationEditFormProps = {
  location: {
    id: string;
    title: string;
    description: string;
    x: number;
    y: number;
    photos: EditablePhoto[];
  };
};

function formatDateTimeLocal(value: Date | null) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 16);
}

function formatCustomMeta(value: unknown) {
  if (!Array.isArray(value)) {
    return "[]";
  }

  const rows = value.filter((item): item is CustomMetaRow => {
    return (
      typeof item === "object" &&
      item !== null &&
      "key" in item &&
      "value" in item &&
      typeof item.key === "string" &&
      typeof item.value === "string"
    );
  });

  return JSON.stringify(rows, null, 2);
}

export function LocationEditForm({ location }: LocationEditFormProps) {
  const updateAction = updateOwnedLocationAction.bind(null, location.id);

  return (
    <form action={updateAction} className="location-form">
      <label>
        <span>地点标题</span>
        <input name="title" defaultValue={location.title} required />
      </label>
      <label>
        <span>地点简介</span>
        <textarea name="description" rows={4} defaultValue={location.description} />
      </label>
      <div className="coordinate-pill">
        坐标只读：x={location.x.toFixed(4)} / y={location.y.toFixed(4)}
      </div>
      <p className="upload-note">保存任意修改后，地点和关联照片都会重新进入待审核状态。</p>

      <div className="photo-field-stack">
        {location.photos.map((photo, index) => (
          <fieldset className="photo-fieldset" key={photo.id}>
            <legend>照片 {index + 1}</legend>
            <input type="hidden" name="photoId" value={photo.id} />
            <label>
              <span>照片标题</span>
              <input name="photoTitle" defaultValue={photo.title} required />
            </label>
            <label>
              <span>照片描述</span>
              <textarea name="photoDescription" rows={3} defaultValue={photo.description} />
            </label>
            <div className="field-grid">
              <label>
                <span>机身</span>
                <input name="cameraBody" defaultValue={photo.cameraBody ?? ""} />
              </label>
              <label>
                <span>镜头</span>
                <input name="lens" defaultValue={photo.lens ?? ""} />
              </label>
              <label>
                <span>焦距</span>
                <input name="focalLength" defaultValue={photo.focalLength ?? ""} />
              </label>
              <label>
                <span>光圈</span>
                <input name="aperture" defaultValue={photo.aperture ?? ""} />
              </label>
              <label>
                <span>快门</span>
                <input name="shutterSpeed" defaultValue={photo.shutterSpeed ?? ""} />
              </label>
              <label>
                <span>ISO</span>
                <input name="iso" defaultValue={photo.iso ?? ""} />
              </label>
              <label>
                <span>拍摄时间</span>
                <input name="shotAt" type="datetime-local" defaultValue={formatDateTimeLocal(photo.shotAt)} />
              </label>
            </div>
            <label>
              <span>自定义字段 JSON</span>
              <textarea name="customMeta" rows={4} defaultValue={formatCustomMeta(photo.customMeta)} />
            </label>
          </fieldset>
        ))}
      </div>

      <button type="submit" className="accent-button">
        保存修改并重新提交审核
      </button>
    </form>
  );
}
