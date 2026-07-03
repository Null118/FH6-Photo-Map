"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  clampOffset,
  clampScale,
  getCenteredOffset,
  getCoveringViewport,
  getPreviewSelectionForScale,
  hasDragged,
  selectPreviewLocations,
  type Point,
} from "@/lib/map";
import type { OwnerMarkerVariant } from "@/lib/me-map";
import type { LocationMapItem } from "@/types";

import { MapBottomBar } from "./map-bottom-bar";
import { MapMarker } from "./map-marker";

type OwnerMapStats = {
  locationCount: number;
  photoCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
};

type OwnerMapLocation = LocationMapItem & {
  markerVariant: OwnerMarkerVariant;
  statusLabel: string;
};

type OwnerMapCanvasProps = {
  locations: OwnerMapLocation[];
  stats: OwnerMapStats;
};

type PressState = {
  point: Point;
  offset: Point;
  pointerId: number;
};

export function OwnerMapCanvas({ locations, stats }: OwnerMapCanvasProps) {
  const router = useRouter();
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [pressState, setPressState] = useState<PressState | null>(null);
  const [hasUserMovedViewport, setHasUserMovedViewport] = useState(false);

  const frameWidth = frameSize.width || 1280;
  const frameHeight = frameSize.height || 900;
  const mapSize = getCoveringViewport({
    outerWidth: frameWidth,
    outerHeight: frameHeight,
    sidebarWidth: 0,
    topInset: 0,
    bottomInset: 0,
  });

  useEffect(() => {
    const node = layoutRef.current;
    if (!node) {
      return;
    }

    function updateSize(target: HTMLDivElement) {
      setFrameSize({
        width: target.clientWidth,
        height: target.clientHeight,
      });
    }

    updateSize(node);

    const observer = new ResizeObserver(() => {
      updateSize(node);
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const activeScale = hasUserMovedViewport ? scale : 1;
  const activeOffset = hasUserMovedViewport
    ? offset
    : getCenteredOffset({
        frameWidth,
        frameHeight,
        contentWidth: mapSize.width,
        contentHeight: mapSize.height,
        scale: 1,
      });
  const previewLocationIds = new Set(
    selectPreviewLocations(locations, getPreviewSelectionForScale(activeScale)).map(
      (location) => location.id,
    ),
  );

  function beginPress(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setPressState({
      point: { x: event.clientX, y: event.clientY },
      offset: activeOffset,
      pointerId: event.pointerId,
    });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pressState || pressState.pointerId !== event.pointerId) {
      return;
    }

    const nextPoint = { x: event.clientX, y: event.clientY };
    if (!hasDragged(pressState.point, nextPoint)) {
      return;
    }

    setHasUserMovedViewport(true);
    setOffset(
      clampOffset({
        frameWidth,
        frameHeight,
        contentWidth: mapSize.width,
        contentHeight: mapSize.height,
        scale: activeScale,
        offsetX: pressState.offset.x + nextPoint.x - pressState.point.x,
        offsetY: pressState.offset.y + nextPoint.y - pressState.point.y,
      }),
    );
  }

  function endPress(event: React.PointerEvent<HTMLDivElement>) {
    if (!pressState || pressState.pointerId !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    setPressState(null);
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();

    const nextScale = clampScale(activeScale - event.deltaY * 0.001);
    if (nextScale === activeScale) {
      return;
    }

    const frameRect = viewportRef.current?.getBoundingClientRect();
    if (!frameRect) {
      setScale(nextScale);
      return;
    }

    const pointerX = event.clientX - frameRect.left;
    const pointerY = event.clientY - frameRect.top;
    const contentX = (pointerX - activeOffset.x) / activeScale;
    const contentY = (pointerY - activeOffset.y) / activeScale;

    setHasUserMovedViewport(true);
    setScale(nextScale);
    setOffset(
      clampOffset({
        frameWidth,
        frameHeight,
        contentWidth: mapSize.width,
        contentHeight: mapSize.height,
        scale: nextScale,
        offsetX: pointerX - contentX * nextScale,
        offsetY: pointerY - contentY * nextScale,
      }),
    );
  }

  const bottomBarItems = [
    { id: "home", label: "返回地图", href: "/" },
    { id: "feedback", label: "问题反馈", href: "#feedback" },
  ];

  return (
    <section ref={layoutRef} className="map-stage-shell is-interactive owner-map-shell">
      <div className="map-stage__ambient" aria-hidden="true">
        <Image
          src="/maps/FH_6.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="map-stage__ambient-image"
        />
      </div>
      <div className="map-stage__scrim" aria-hidden="true" />

      <div className="map-stage is-browsing owner-map-stage">
        <div
          ref={viewportRef}
          className="map-stage__viewport owner-map-viewport"
          style={{
            width: `${frameWidth}px`,
            height: `${frameHeight}px`,
          }}
          onPointerDown={beginPress}
          onPointerMove={handlePointerMove}
          onPointerUp={endPress}
          onPointerCancel={() => setPressState(null)}
          onWheel={handleWheel}
        >
          <div
            className="map-stage__surface"
            style={{
              transform: `translate3d(${activeOffset.x}px, ${activeOffset.y}px, 0) scale(${activeScale})`,
              width: `${mapSize.width}px`,
              height: `${mapSize.height}px`,
            }}
          >
            <div className="map-stage__image-layer">
              <Image
                src="/maps/FH_6.jpg"
                alt="Forza Horizon 6 static map"
                fill
                priority
                sizes="100vw"
                className="map-image"
              />
            </div>
            <div className="map-stage__marker-layer">
              {locations.map((item) => (
                <MapMarker
                  key={item.id}
                  left={`${item.x * 100}%`}
                  top={`${item.y * 100}%`}
                  label={item.title}
                  variant={item.markerVariant}
                  photoCount={item.photoCount}
                  coverImagePath={item.coverImagePath}
                  showPreview={previewLocationIds.has(item.id)}
                  metaLabel={item.statusLabel}
                  onClick={() => router.push(`/me/locations/${item.id}`)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="map-hud owner-map-hud">
        <div className="owner-map-hud__summary">
          <div className="map-hud__header">
            <p className="eyebrow">My Photo Map</p>
            <h1>管理我的图片</h1>
            <p className="lead">
              地图用于定位你的摄影点，列表用于快速查看、筛选和进入编辑。
            </p>
          </div>

          <div className="owner-map-stat-grid">
            <div className="map-hud__stats">
              <span className="map-hud__stat-label">我的标点</span>
              <strong>{stats.locationCount}</strong>
            </div>
            <div className="map-hud__stats">
              <span className="map-hud__stat-label">我的照片</span>
              <strong>{stats.photoCount}</strong>
            </div>
          </div>

          <div className="owner-map-legend" aria-label="审核状态图例">
            <span>
              <i className="owner-map-legend__dot is-approved" />
              已通过 {stats.approvedCount}
            </span>
            <span>
              <i className="owner-map-legend__dot is-pending" />
              待审核 {stats.pendingCount}
            </span>
            <span>
              <i className="owner-map-legend__dot is-rejected" />
              未通过 {stats.rejectedCount}
            </span>
          </div>

          <div className="map-hud__panel">
            <h2>{locations.length > 0 ? "编辑后会重新审核" : "还没有提交内容"}</h2>
            <p>
              {locations.length > 0
                ? "你可以修改地点简介、照片说明和拍摄参数。任何保存都会把地点与照片状态重置为待审核。"
                : "回到首页地图，登录后使用“添加标点”提交你的第一个摄影地点。"}
            </p>
          </div>
        </div>

        {locations.length > 0 ? (
          <ul className="owner-location-list" aria-label="我的地点列表">
            {locations.map((item) => (
              <li key={item.id} className="owner-location-row">
                <div className="owner-location-row__thumb" aria-hidden="true">
                  {item.coverImagePath ? (
                    <Image
                      src={item.coverImagePath}
                      alt=""
                      fill
                      sizes="88px"
                      className="owner-location-row__image"
                    />
                  ) : (
                    <span>无图</span>
                  )}
                </div>

                <div className="owner-location-row__body">
                  <div className="owner-location-row__title-line">
                    <strong>{item.title}</strong>
                    <span className={`owner-location-status is-${item.markerVariant}`}>
                      {item.statusLabel}
                    </span>
                  </div>
                  <p>X {formatPercent(item.x)} / Y {formatPercent(item.y)}</p>
                  <span>{item.photoCount} 张照片</span>
                </div>

                <Link
                  className="owner-location-row__edit"
                  href={`/me/locations/${item.id}`}
                  aria-label={`编辑 ${item.title}`}
                >
                  编辑<span className="sr-only"> {item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </aside>

      <MapBottomBar items={bottomBarItems} />
    </section>
  );
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}
