import { PROVINCE_CONTENT } from './provinces';

export type ProvinceBuilding = {
  id: string;
  name: string;
  description: string;
  imagePlaceholder: boolean;
  detailPath?: string;
  isAvailable: boolean;
};

export type ProvinceBuildingGroup = {
  provinceId: string;
  provinceName: string;
  provinceVisualPlaceholder: boolean;
  buildings: ProvinceBuilding[];
};

const DEFAULT_PROVINCE_NAME = '未知地域';

export function getProvinceBuildingGroup(provinceId: string): ProvinceBuildingGroup {
  const content = PROVINCE_CONTENT[provinceId];
  const provinceName = content?.name ?? DEFAULT_PROVINCE_NAME;

  return {
    provinceId,
    provinceName,
    provinceVisualPlaceholder: true,
    buildings: [
      {
        id: `${provinceId}-primary`,
        name: content?.arch ?? '建筑名称占位 1',
        description: content?.subtitle ?? '该省份的建筑详情资料待补充。',
        imagePlaceholder: !content,
        detailPath: content ? `/learn/${provinceId}` : undefined,
        isAvailable: Boolean(content),
      },
      {
        id: `${provinceId}-reserved-2`,
        name: '建筑名称占位 2',
        description: '第二处建筑资料待补充，后续可在这里接入真实缩略图、简介与详情页路径。',
        imagePlaceholder: true,
        isAvailable: false,
      },
    ],
  };
}
