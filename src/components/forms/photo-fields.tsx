"use client";

import { type ChangeEvent, useState } from "react";

import { getImageUploadSizeError, IMAGE_UPLOAD_MAX_MB } from "@/lib/upload-constraints";

type PhotoDraft = {
  id: number;
};

export function PhotoFields() {
  const [rows, setRows] = useState<PhotoDraft[]>([{ id: 1 }]);
  const [fileError, setFileError] = useState<string | null>(null);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      return;
    }

    const error = getImageUploadSizeError(file.name, file.size);
    if (!error) {
      setFileError(null);
      return;
    }

    event.currentTarget.value = "";
    setFileError(error);
    window.alert(error);
  }

  return (
    <div className="photo-field-stack">
      <p className="upload-note">支持 JPG / PNG / WEBP / GIF，单张图片最大约 {IMAGE_UPLOAD_MAX_MB}MB。</p>
      {fileError ? (
        <p className="upload-error" role="alert">
          {fileError}
        </p>
      ) : null}
      {rows.map((row, index) => (
        <fieldset className="photo-fieldset" key={row.id}>
          <legend>照片 {index + 1}</legend>
          <label>
            <span>图片文件</span>
            <input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              required
            />
          </label>
          <label>
            <span>照片标题</span>
            <input name="photoTitle" placeholder="例如：火山口逆光机位" required />
          </label>
          <label>
            <span>照片描述</span>
            <textarea name="photoDescription" rows={3} placeholder="记录机位特点、时间、方向或注意事项" />
          </label>
          <div className="field-grid">
            <label>
              <span>机身</span>
              <input name="cameraBody" placeholder="Sony A7C II" />
            </label>
            <label>
              <span>镜头</span>
              <input name="lens" placeholder="24-70mm f/2.8" />
            </label>
            <label>
              <span>焦距</span>
              <input name="focalLength" placeholder="35mm" />
            </label>
            <label>
              <span>光圈</span>
              <input name="aperture" placeholder="f/2.8" />
            </label>
            <label>
              <span>快门</span>
              <input name="shutterSpeed" placeholder="1/200" />
            </label>
            <label>
              <span>ISO</span>
              <input name="iso" placeholder="100" />
            </label>
            <label>
              <span>拍摄时间</span>
              <input name="shotAt" type="datetime-local" />
            </label>
          </div>
          <label>
            <span>自定义字段 JSON</span>
            <textarea
              name="customMeta"
              rows={3}
              defaultValue='[]'
              placeholder='例如：[{"key":"天气","value":"晴天"},{"key":"车辆","value":"AMG One"}]'
            />
          </label>
        </fieldset>
      ))}
      <button
        type="button"
        className="secondary-button"
        onClick={() => setRows((current) => [...current, { id: Date.now() + current.length }])}
      >
        再添加一张照片
      </button>
    </div>
  );
}
