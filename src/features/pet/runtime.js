function createState(province) {
  return {
    provinceId: province.id,
    x: province.x,
    y: province.y,
  };
}

export function createPetOnMap({
  provinces,
  skins,
  initialProvinceId,
  elements,
  onProvinceEnter,
  onStateChange,
  onReady,
  onSkinChange,
  onMoveComplete,
}) {
  const provinceById = new Map(provinces.map((province) => [province.id, province]));
  const skinById = new Map(skins.map((skin) => [skin.id, skin]));
  const initialProvince =
    provinceById.get(initialProvinceId) ??
    provinces[0];

  if (!initialProvince) {
    throw new Error("createPetOnMap requires at least one province node.");
  }

  const state = createState(initialProvince);
  let activeSkinId = skins[0]?.id ?? "scholar";
  let animationFrameId = 0;

  const {
    petElement,
    petCharacter,
    petBadge,
  } = elements;

  function renderPetAt(x, y) {
    petElement.style.left = `${x}px`;
    petElement.style.top = `${y}px`;
  }

  function emitState(nextState) {
    state.provinceId = nextState.provinceId;
    state.x = nextState.x;
    state.y = nextState.y;
    onStateChange?.({ ...state });
  }

  function applySkin(skinId) {
    const skin = skinById.get(skinId) ?? skins[0];
    if (!skin) return;

    activeSkinId = skin.id;
    petElement.style.setProperty("--pet-robe", skin.robe);
    petElement.style.setProperty("--pet-glow", skin.glow);
    petElement.style.setProperty("--pet-eye", skin.eye);
    petBadge.textContent = skin.label;
    petCharacter.textContent = skin.id === "lady" ? "🦊" : "🐼";
    onSkinChange?.(skin);
  }

  function moveToProvince(provinceId) {
    const targetProvince = provinceById.get(provinceId);
    if (!targetProvince) return;

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    const start = { x: state.x, y: state.y };
    const target = { x: targetProvince.x, y: targetProvince.y };
    const startTime = performance.now();
    const duration = 620;

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextX = start.x + (target.x - start.x) * eased;
      const nextY = start.y + (target.y - start.y) * eased;

      renderPetAt(nextX, nextY);
      emitState({
        provinceId,
        x: nextX,
        y: nextY,
      });

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      animationFrameId = 0;
      onProvinceEnter?.(provinceId);
      onMoveComplete?.(provinceId);
    }

    animationFrameId = requestAnimationFrame(tick);
  }

  const api = {
    moveToProvince,
    setSkin(skinId) {
      if (!skinById.has(skinId)) return;
      applySkin(skinId);
    },
    getState() {
      return { ...state };
    },
    getProvinceData() {
      return provinces.slice();
    },
    getSkinData() {
      return skins.slice();
    },
  };

  applySkin(activeSkinId);
  renderPetAt(state.x, state.y);
  onProvinceEnter?.(state.provinceId);
  emitState(state);
  onReady?.(api);

  return api;
}
