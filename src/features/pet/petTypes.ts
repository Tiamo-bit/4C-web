import type { CSSProperties } from "react";
export type { Direction } from "../../types/gesture";

export type ProvinceNode = {
  id: string;
  name: string;
  x: number;
  y: number;
  neighbors: string[];
  description?: string;
};

export type PetSkin = {
  id: string;
  label: string;
  accent: string;
  robe: string;
  glow: string;
  eye: string;
};

export type PetPosition = {
  provinceId: string;
  x: number;
  y: number;
};

export type PetOnMapHandle = {
  getCurrentProvinceId: () => string;
  getPosition: () => PetPosition;
  moveByDirection: (direction: Direction) => void;
  setSkin: (skinId: string) => void;
  moveToProvince: (provinceId: string) => void;
};

export type PetOnMapProps = {
  className?: string;
  style?: CSSProperties;
  width?: number | string;
  height?: number | string;
  nodes?: ProvinceNode[];
  skins?: PetSkin[];
  initialProvinceId?: string;
  gestureMode?: "auto" | "mediapipe" | "pointer";
  enableCamera?: boolean;
  onProvinceEnter?: (provinceId: string) => void;
  onStateChange?: (state: PetPosition) => void;
  onReady?: (api: PetOnMapHandle) => void;
};
