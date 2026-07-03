import Image from "next/image";

type MapMarkerProps = {
  left: string;
  top: string;
  label: string;
  onClick?: () => void;
  transient?: boolean;
  variant?: "default" | "approved" | "pending" | "rejected";
  photoCount?: number;
  coverImagePath?: string | null;
  showPreview?: boolean;
  metaLabel?: string;
  highlighted?: boolean;
};

export function MapMarker({
  left,
  top,
  label,
  onClick,
  transient = false,
  variant = "default",
  photoCount,
  coverImagePath,
  showPreview = false,
  metaLabel,
  highlighted = false,
}: MapMarkerProps) {
  return (
    <button
      type="button"
      className={[
        "map-marker",
        transient ? "is-transient" : "",
        showPreview ? "has-preview" : "",
        highlighted ? "is-highlighted" : "",
        variant !== "default" ? `is-${variant}` : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ left, top }}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      aria-label={label}
    >
      {showPreview && coverImagePath ? (
        <span className="map-marker__preview" aria-hidden="true">
          {metaLabel ? <span className="map-marker__status-strip">{metaLabel}</span> : null}
          <span className="map-marker__preview-image">
            <Image src={coverImagePath} alt="" fill sizes="168px" className="map-marker__image" />
          </span>
          <span className="map-marker__preview-body">
            <span className="map-marker__title">{label}</span>
          </span>
        </span>
      ) : null}
      {typeof photoCount === "number" ? (
        <span className="map-marker__photo-tooltip is-pin-right" aria-hidden="true">
          {photoCount} 张图片
        </span>
      ) : null}
      <span className="map-marker__pin" aria-hidden="true">
        <span className="map-marker__pin-core" />
      </span>
    </button>
  );
}
