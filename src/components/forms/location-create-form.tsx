import { createLocationAction } from "@/app/actions/location-actions";

import { PhotoFields } from "./photo-fields";

type LocationCreateFormProps = {
  x: string;
  y: string;
};

export function LocationCreateForm({ x, y }: LocationCreateFormProps) {
  return (
    <form action={createLocationAction} className="location-form">
      <input type="hidden" name="x" value={x} />
      <input type="hidden" name="y" value={y} />
      <label>
        <span>地点标题</span>
        <input name="title" placeholder="例如：峡谷弯道落日观景点" required />
      </label>
      <label>
        <span>地点简介</span>
        <textarea
          name="description"
          rows={4}
          placeholder="描述地形、推荐时间、构图方向、是否容易遇到 NPC 车辆等。"
        />
      </label>
      <div className="coordinate-pill">
        相对坐标：x={x} / y={y}
      </div>
      <PhotoFields />
      <button type="submit" className="accent-button">
        保存地点并进入详情
      </button>
    </form>
  );
}
