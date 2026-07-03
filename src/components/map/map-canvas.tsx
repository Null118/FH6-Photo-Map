"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  clampOffset,
  clampScale,
  getCenteredOffset,
  getCoveringViewport,
  getFocusedOffset,
  getPreviewSelectionSeed,
  getPreviewSelectionForScale,
  getShowcasePreviewSelection,
  getVisibleMapBounds,
  hasDragged,
  isQuickClick,
  normalizeRelativePoint,
  selectPreviewLocations,
  type Point,
} from "@/lib/map";
import type { AuthSession, LocationMapItem } from "@/types";

import { MapBottomBar } from "./map-bottom-bar";
import { MapHud } from "./map-hud";
import { MapMarker } from "./map-marker";
import { MapSessionBottomBar } from "./map-session-bottom-bar";

type MapCanvasProps = {
  locations: LocationMapItem[];
  session: AuthSession | null;
};

type MapCanvasMode = "showcase" | "browse" | "add";

type PressState = {
  point: Point;
  time: number;
  offset: Point;
  pointerId: number;
  moved: boolean;
};

type PreviewViewport = {
  scale: number;
  offset: Point;
};

const WHEEL_PREVIEW_SETTLE_MS = 140;

export function MapCanvas({ locations, session }: MapCanvasProps) {
  const router = useRouter();
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const wheelPreviewTimerRef = useRef<number | null>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [mode, setMode] = useState<MapCanvasMode>("showcase");
  const [focusedLocationId, setFocusedLocationId] = useState<string | null>(null);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [pressState, setPressState] = useState<PressState | null>(null);
  const [hasUserMovedViewport, setHasUserMovedViewport] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport | null>(null);

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

  useEffect(() => {
    return () => {
      if (wheelPreviewTimerRef.current) {
        window.clearTimeout(wheelPreviewTimerRef.current);
      }
    };
  }, []);

  const isAdding = mode === "add";
  const isInteractive = mode !== "showcase";
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
  const previewScale = previewViewport?.scale ?? activeScale;
  const previewOffset = previewViewport?.offset ?? activeOffset;
  const visibleMapBounds = getVisibleMapBounds({
    frameWidth,
    frameHeight,
    contentWidth: mapSize.width,
    contentHeight: mapSize.height,
    scale: previewScale,
    offsetX: previewOffset.x,
    offsetY: previewOffset.y,
  });
  const previewSelectionOptions = {
    ...getPreviewSelectionForScale(previewScale),
    bounds: visibleMapBounds,
    seed: getPreviewSelectionSeed({ bounds: visibleMapBounds, scale: previewScale }),
  };
  const previewLocations = selectPreviewLocations(locations, previewSelectionOptions);
  const previewLocationIds = new Set(previewLocations.map((location) => location.id));
  if (focusedLocationId) {
    previewLocationIds.add(focusedLocationId);
  }
  const showcaseLocations = selectPreviewLocations(locations, getShowcasePreviewSelection());

  function clearWheelPreviewCommit() {
    if (wheelPreviewTimerRef.current) {
      window.clearTimeout(wheelPreviewTimerRef.current);
      wheelPreviewTimerRef.current = null;
    }
  }

  function beginPress(event: React.PointerEvent<HTMLDivElement>) {
    if (typeof event.currentTarget.setPointerCapture === "function") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    clearWheelPreviewCommit();
    setPressState({
      point: { x: event.clientX, y: event.clientY },
      time: event.timeStamp,
      offset: activeOffset,
      pointerId: event.pointerId,
      moved: false,
    });
    setPreviewViewport({ scale: activeScale, offset: activeOffset });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pressState || pressState.pointerId !== event.pointerId) {
      return;
    }

    const nextPoint = { x: event.clientX, y: event.clientY };
    const moved = hasDragged(pressState.point, nextPoint);
    if (!moved) {
      return;
    }

    setPressState((current) => (current ? { ...current, moved: true } : current));
    setHasUserMovedViewport(true);

    const nextOffset = clampOffset({
      frameWidth,
      frameHeight,
      contentWidth: mapSize.width,
      contentHeight: mapSize.height,
      scale: activeScale,
      offsetX: pressState.offset.x + nextPoint.x - pressState.point.x,
      offsetY: pressState.offset.y + nextPoint.y - pressState.point.y,
    });

    setOffset(nextOffset);
  }

  function commitDraggedPreviewViewport(event: React.PointerEvent<HTMLDivElement>, state: PressState) {
    const finalOffset = clampOffset({
      frameWidth,
      frameHeight,
      contentWidth: mapSize.width,
      contentHeight: mapSize.height,
      scale: activeScale,
      offsetX: state.offset.x + event.clientX - state.point.x,
      offsetY: state.offset.y + event.clientY - state.point.y,
    });

    setHasUserMovedViewport(true);
    setOffset(finalOffset);
    setPreviewViewport({ scale: activeScale, offset: finalOffset });
  }

  function endPress(event: React.PointerEvent<HTMLDivElement>) {
    if (!pressState || pressState.pointerId !== event.pointerId) {
      return;
    }

    if (typeof event.currentTarget.releasePointerCapture === "function") {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const duration = event.timeStamp - pressState.time;
    const moved =
      pressState.moved || hasDragged(pressState.point, { x: event.clientX, y: event.clientY });

    if (moved) {
      commitDraggedPreviewViewport(event, pressState);
    }

    setPressState(null);

    if (!isAdding || moved || !isQuickClick(duration)) {
      return;
    }

    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const point = normalizeRelativePoint({
      clientX: event.clientX,
      clientY: event.clientY,
      rectLeft: rect.left,
      rectTop: rect.top,
      rectWidth: rect.width,
      rectHeight: rect.height,
      contentWidth: mapSize.width,
      contentHeight: mapSize.height,
      offsetX: activeOffset.x,
      offsetY: activeOffset.y,
      scale: activeScale,
    });

    router.push(`/locations/new?x=${point.x.toFixed(4)}&y=${point.y.toFixed(4)}`);
  }

  function cancelPress(event: React.PointerEvent<HTMLDivElement>) {
    if (!pressState || pressState.pointerId !== event.pointerId) {
      return;
    }

    if (typeof event.currentTarget.releasePointerCapture === "function") {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const moved =
      pressState.moved || hasDragged(pressState.point, { x: event.clientX, y: event.clientY });

    if (moved) {
      commitDraggedPreviewViewport(event, pressState);
    }

    setPressState(null);
  }

  function scheduleWheelPreviewCommit(viewport: PreviewViewport) {
    clearWheelPreviewCommit();

    wheelPreviewTimerRef.current = window.setTimeout(() => {
      setPreviewViewport(viewport);
      wheelPreviewTimerRef.current = null;
    }, WHEEL_PREVIEW_SETTLE_MS);
  }

  function freezeWheelPreviewViewport() {
    if (!previewViewport && !wheelPreviewTimerRef.current) {
      setPreviewViewport({ scale: activeScale, offset: activeOffset });
    }
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();

    const nextScale = clampScale(activeScale - event.deltaY * 0.001);
    if (nextScale === activeScale) {
      return;
    }

    freezeWheelPreviewViewport();

    const frameRect = viewportRef.current?.getBoundingClientRect();
    if (!frameRect) {
      setHasUserMovedViewport(true);
      setScale(nextScale);
      scheduleWheelPreviewCommit({ scale: nextScale, offset: activeOffset });
      return;
    }

    const pointerX = event.clientX - frameRect.left;
    const pointerY = event.clientY - frameRect.top;
    const contentX = (pointerX - activeOffset.x) / activeScale;
    const contentY = (pointerY - activeOffset.y) / activeScale;

    const nextOffset = clampOffset({
      frameWidth,
      frameHeight,
      contentWidth: mapSize.width,
      contentHeight: mapSize.height,
      scale: nextScale,
      offsetX: pointerX - contentX * nextScale,
      offsetY: pointerY - contentY * nextScale,
    });

    setHasUserMovedViewport(true);
    setScale(nextScale);
    setOffset(nextOffset);
    scheduleWheelPreviewCommit({ scale: nextScale, offset: nextOffset });
  }

  const bottomBarItems = [
    { id: "feedback", label: "问题反馈", href: "#feedback" },
    { id: "login", label: "用户登录", href: "/login" },
  ];

  function toggleAddMode() {
    if (!session) {
      setLoginPrompt(true);
      return;
    }

    setMode((value) => (value === "add" ? "browse" : "add"));
    setFocusedLocationId(null);
  }

  function startFreeBrowse() {
    setLoginPrompt(false);
    setPressState(null);
    setMode("browse");
    setFocusedLocationId(null);
    setHasUserMovedViewport(false);
    setPreviewViewport(null);
  }

  function focusLocation(location: LocationMapItem) {
    const nextScale = Math.max(activeScale, 1.45);
    const nextOffset = getFocusedOffset({
      frameWidth,
      frameHeight,
      contentWidth: mapSize.width,
      contentHeight: mapSize.height,
      scale: nextScale,
      x: location.x,
      y: location.y,
    });

    setLoginPrompt(false);
    setPressState(null);
    setMode("browse");
    setFocusedLocationId(location.id);
    setHasUserMovedViewport(true);
    setScale(nextScale);
    setOffset(nextOffset);
    setPreviewViewport({ scale: nextScale, offset: nextOffset });
  }

  return (
    <section
      ref={layoutRef}
      className={["map-stage-shell", isAdding ? "is-adding" : "", isInteractive ? "is-interactive" : ""]
        .filter(Boolean)
        .join(" ")}
    >
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
      {!isInteractive ? (
        <div className="map-showcase-background" aria-hidden="true">
          <Image
            src="/maps/FH_6.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="map-showcase-background__image"
          />
        </div>
      ) : null}
      <div className="map-stage__scrim" aria-hidden="true" />

      <div
        className={["map-stage", isAdding ? "is-adding" : "", mode === "browse" ? "is-browsing" : ""]
          .filter(Boolean)
          .join(" ")}
        aria-hidden={!isInteractive}
      >
        <div
          ref={viewportRef}
          className="map-stage__viewport"
          data-testid="map-viewport"
          style={{
            width: `${frameWidth}px`,
            height: `${frameHeight}px`,
          }}
          onPointerDown={isInteractive ? beginPress : undefined}
          onPointerMove={isInteractive ? handlePointerMove : undefined}
          onPointerUp={isInteractive ? endPress : undefined}
          onPointerCancel={isInteractive ? cancelPress : undefined}
          onWheel={isInteractive ? handleWheel : undefined}
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
            {isInteractive ? (
              <div className="map-stage__marker-layer">
                {locations.filter((item) => previewLocationIds.has(item.id)).map((item) => (
                  <MapMarker
                    key={item.id}
                    left={`${item.x * 100}%`}
                    top={`${item.y * 100}%`}
                    label={item.title}
                    photoCount={item.photoCount}
                    coverImagePath={item.coverImagePath}
                    showPreview={previewLocationIds.has(item.id)}
                    highlighted={focusedLocationId === item.id}
                    onClick={() => router.push(`/locations/${item.id}`)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {mode === "showcase" && showcaseLocations.length > 0 ? (
        <section className="map-showcase-rail" aria-label="精选摄影地点">
          <div className="map-showcase-rail__heading">
            <p className="eyebrow">Featured spots</p>
            <h2>精选摄影地点</h2>
          </div>
          <div className="map-showcase-rail__track">
            {showcaseLocations.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className="map-showcase-card"
                aria-label={`在地图中查看 ${item.title}`}
                onClick={() => focusLocation(item)}
              >
                <span className="map-showcase-card__image">
                  <Image
                    src={item.coverImagePath ?? "/maps/FH_6.jpg"}
                    alt=""
                    fill
                    sizes="220px"
                    className="map-showcase-card__img"
                  />
                </span>
                <span className="map-showcase-card__shade" aria-hidden="true" />
                <span className="map-showcase-card__index">{String(index + 1).padStart(2, "0")}</span>
                <span className="map-showcase-card__body">
                  <strong>{item.title}</strong>
                  <span>{item.photoCount} 张照片</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <MapHud
        mode={mode}
        isLoggedIn={Boolean(session)}
        locationCount={locations.length}
        onStartBrowse={startFreeBrowse}
        onToggleAddMode={toggleAddMode}
      />

      {loginPrompt ? (
        <div className="map-alert" role="alert">
          <p>登录后才能进行添加！</p>
          <button type="button" className="secondary-button" onClick={() => setLoginPrompt(false)}>
            知道了
          </button>
        </div>
      ) : null}

      {session ? <MapSessionBottomBar /> : <MapBottomBar items={bottomBarItems} />}
    </section>
  );
}
