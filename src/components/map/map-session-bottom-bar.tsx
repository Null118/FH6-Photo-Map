import { logoutAction } from "@/app/actions/auth-actions";

export function MapSessionBottomBar() {
  return (
    <form action={logoutAction} className="map-bottom-bar" aria-label="Map utility actions">
      <a href="#feedback" className="map-bottom-bar__item">
        问题反馈
      </a>
      <button type="submit" className="map-bottom-bar__item map-bottom-bar__button">
        退出登录
      </button>
    </form>
  );
}
