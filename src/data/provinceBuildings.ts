import { PROVINCE_CONTENT } from './provinces';
import documentedSecondaryBuildingContent from './secondaryBuildingContent.json';

export type ProvinceBuildingContent = {
  buildingId: string;
  name: string;
  arch: string;
  subtitle: string;
  card: string;
  sections: {
    title: string;
    body: string;
  }[];
  highlights: string[];
  totalPieces?: number;
};

export type ProvinceBuilding = {
  id: string;
  name: string;
  description: string;
  detailPath?: string;
};

export type ProvinceBuildingGroup = {
  provinceId: string;
  provinceName: string;
  buildings: ProvinceBuilding[];
};

export const PRIMARY_BUILDING_ID = 'primary';
export const SECONDARY_BUILDING_ID = 'secondary';

const DEFAULT_PROVINCE_NAME = '未知地域';

type SecondaryBuildingDraft = Omit<ProvinceBuildingContent, 'buildingId' | 'name' | 'totalPieces'>;

const SECONDARY_BUILDING_CONTENT = documentedSecondaryBuildingContent as Record<
  string,
  SecondaryBuildingDraft
>;

function toPrimaryBuildingContent(provinceId: string): ProvinceBuildingContent | null {
  const content = PROVINCE_CONTENT[provinceId];
  if (!content) return null;

  return {
    ...content,
    buildingId: PRIMARY_BUILDING_ID,
  };
}

function toSecondaryBuildingContent(provinceId: string): ProvinceBuildingContent | null {
  const primary = toPrimaryBuildingContent(provinceId);
  if (!primary) return null;
  const override = SECONDARY_BUILDING_CONTENT[provinceId];

  if (override) {
    return {
      ...override,
      buildingId: SECONDARY_BUILDING_ID,
      name: primary.name,
      totalPieces: primary.totalPieces,
    };
  }

  return {
    buildingId: SECONDARY_BUILDING_ID,
    name: primary.name,
    arch: '建筑名称占位 2',
    subtitle: `${primary.name}的第二处代表建筑素材已接入，具体建筑名称、简介与科普正文待补充。`,
    card: `这是一处来自${primary.name}的新增古建筑素材。当前已配置实景照片与拼图图片，后续可替换为真实建筑名片。`,
    sections: [
      {
        title: '身世溯源',
        body: `这里将补充${primary.name}第二处代表建筑的历史源流、建造年代与地域文化背景。`,
      },
      {
        title: '建筑亮点',
        body: '这里将补充该建筑的结构特色、装饰工艺、空间布局与营造智慧。',
      },
      {
        title: '历史高光',
        body: '这里将补充该建筑的重要事件、保护价值、文化影响与当代传承。',
      },
    ],
    highlights: ['新增建筑', '资料待补充', primary.name],
    totalPieces: primary.totalPieces,
  };
}

export function getBuildingAssetKey(provinceId: string, buildingId = PRIMARY_BUILDING_ID): string {
  return buildingId === PRIMARY_BUILDING_ID ? provinceId : `${provinceId}/${buildingId}`;
}

export function getProvinceBuildingContents(provinceId: string): ProvinceBuildingContent[] {
  return [toPrimaryBuildingContent(provinceId), toSecondaryBuildingContent(provinceId)].filter(
    (building): building is ProvinceBuildingContent => Boolean(building)
  );
}

export function getProvinceBuildingContent(
  provinceId: string,
  buildingId = PRIMARY_BUILDING_ID
): ProvinceBuildingContent | null {
  const buildings = getProvinceBuildingContents(provinceId);
  return buildings.find((building) => building.buildingId === buildingId) || null;
}

export function getProvinceBuildingGroup(provinceId: string): ProvinceBuildingGroup {
  const buildings = getProvinceBuildingContents(provinceId);
  const provinceName = buildings[0]?.name ?? DEFAULT_PROVINCE_NAME;

  return {
    provinceId,
    provinceName,
    buildings: buildings.map((building) => ({
      id: building.buildingId,
      name: building.arch,
      description: building.subtitle,
      detailPath: `/learn/${provinceId}/${building.buildingId}`,
    })),
  };
}
