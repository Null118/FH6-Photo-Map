import Link from "next/link";

type MapHudMode = "showcase" | "browse" | "add";

type MapHudProps = {
  mode: MapHudMode;
  isLoggedIn: boolean;
  locationCount: number;
  onStartBrowse: () => void;
  onToggleAddMode: () => void;
};

const hudCopy: Record<MapHudMode, { title: string; lead: string; panelTitle: string; panelBody: string }> = {
  showcase: {
    title: "发现玩家镜头里的地平线。",
    lead: "上方随机展示已通过审核的摄影地点。点击预览图后，会进入可拖拽缩放的地图浏览。",
    panelTitle: "浏览已发布地点",
    panelBody: "点击上方预览图可以在地图中定位到该地点。登录后可以提交自己的摄影地点。",
  },
  browse: {
    title: "在地图中查看这个摄影点。",
    lead: "左键按住拖拽地图，滚轮缩放视图。点击地图上的预览图或标点可以进入地点详情。",
    panelTitle: "地图浏览模式",
    panelBody: "默认只展示一部分预览图，放大地图后会逐步显示更多地点，避免画面拥挤。",
  },
  add: {
    title: "选择你刚刚停车取景的位置。",
    lead: "左键按住拖拽地图，滚轮缩放视图。只有快速单击地图空白位置，才会新增标点。",
    panelTitle: "打点模式已开启",
    panelBody: "打点模式下地图仍然可以拖拽和缩放，只有快速单击空白位置才会进入新地点创建流程。",
  },
};

export function MapHud({ mode, isLoggedIn, locationCount, onStartBrowse, onToggleAddMode }: MapHudProps) {
  const isAdding = mode === "add";
  const isShowcase = mode === "showcase";
  const copy = hudCopy[mode];

  return (
    <aside className="map-hud">
      <div className="map-hud__header">
        <p className="eyebrow">FH6 Photo Map</p>
        <h1>{copy.title}</h1>
        <p className="lead">{copy.lead}</p>
      </div>

      <div className="map-hud__stats">
        <span className="map-hud__stat-label">已发布地点</span>
        <strong>{locationCount}</strong>
      </div>

      <div className="map-hud__actions">
        {isShowcase ? (
          <button type="button" className="map-hud__ghost-button" onClick={onStartBrowse}>
            自由探索
          </button>
        ) : null}
        <button type="button" className="accent-button map-hud__cta" onClick={onToggleAddMode}>
          {isAdding ? "退出打点模式" : "添加标点"}
        </button>
      </div>

      {isLoggedIn ? (
        <Link href="/me" className="map-hud__panel map-hud__panel-link">
          <h2>管理我的图片</h2>
          <p>查看自己提交的标点、照片和审核状态，后续可以在这里继续管理拍摄参数。</p>
        </Link>
      ) : (
        <div className="map-hud__panel">
          <h2>{copy.panelTitle}</h2>
          <p>{copy.panelBody}</p>
        </div>
      )}
    </aside>
  );
}
