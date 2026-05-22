import { PROVINCE_CONTENT } from './provinces';

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

const SECONDARY_BUILDING_CONTENT: Record<string, SecondaryBuildingDraft> = {
  sichuan: {
    arch: '羌族碉房',
    subtitle: '源出川西北古羌石砌传统、碉楼与民居融为一体的高山峡谷住宅，以桃坪羌寨为代表的“东方古堡”式民居标本',
    card: '官方名称：羌族碉房，代表实例为桃坪羌寨碉楼与民居建筑群；核心分布：四川省阿坝藏族羌族自治州理县、茂县、汶川、北川等羌族聚居区，本条以理县桃坪羌寨为代表；起源定型：源于川西北羌族“垒石为室”的山地居住传统，桃坪羌寨相传始建于西汉时期；文保与保护：桃坪羌寨为国家级重点文物保护单位相关保护对象，其保护与复原项目曾获联合国教科文组织亚太地区文化遗产保护奖“杰出项目奖”；建筑类型：石木结构、多层分工、碉楼与民居复合的羌族山地传统住宅；民间称号：羌族建筑艺术活化石、神秘的东方古堡、川西北石砌民居代表。',
    sections: [
      {
        title: '身世溯源',
        body: '羌族碉房并不是单独拔地而起的高碉，也不是普通石屋的简单加高，而是川西北高山峡谷环境中形成的“碉楼—住宅—巷道—水网”复合居住系统。阿坝州地处青藏高原东缘，山谷深切、台地狭窄、石料充足，传统聚落既要解决日常居住、牲畜饲养、粮食储藏，也要应对山地防御、族群聚居和灾害风险，于是逐渐形成了厚墙、窄窗、多层、可守可居的碉房体系。桃坪羌寨是这一体系最醒目的代表。寨子坐落在理县杂谷脑河谷，背山面水，羌族先民利用山体片石砌筑房屋，将住宅、碉楼、暗渠、屋顶通道和狭窄甬道编织成一个立体村寨。它的价值不只在“古老”，更在于至今还能看出真实生活如何与防御逻辑、交通系统、水源系统结合。',
      },
      {
        title: '建筑亮点',
        body: '羌族碉房最鲜明的建筑亮点，是把石砌住宅做成“居住堡垒”。房屋多采用片石、卵石、黄泥和木梁组合建造，墙体厚重，下宽上收，外墙略向内倾，使整体重心稳定；门窗开口相对克制，既利于保温，也兼具防御意味。其空间分工非常清楚：下层常用于圈养牲畜、堆放柴草和农具，中层为家庭生活核心，火塘、客厅、卧室和祭祀空间围绕日常礼俗展开，上层或屋顶用于储粮、晒粮、晾晒作物和观察瞭望。桃坪羌寨还把甬道、暗渠、屋顶平台连接为立体交通网络，地下水渠则把雪山融水引入寨内，既满足生活用水，也构成战时难以被切断的生命线。',
      },
      {
        title: '历史高光',
        body: '桃坪羌寨常被称为“羌族建筑艺术活化石”，其高光并不只是旅游意义上的奇观，而在于它完整保存了羌族传统村寨从居住、防御到水利的综合系统。2008 年汶川特大地震后，寨内大量民居受损，但多数碉房与碉楼并未完全倒塌，显示出传统石砌工法的稳定性。此后，桃坪羌寨按照“修旧如旧”的原则开展保护与复原，既修复建筑，也尽量保留原有材料、工艺和村寨肌理。2016 年，四川理县桃坪羌寨保护与复原项目获得联合国教科文组织亚太地区文化遗产保护奖“杰出项目奖”，使这座羌寨从地方民居样本上升为国际文化遗产保护案例。',
      },
    ],
    highlights: ['羌族民居', '高原石砌建筑', '碉房合一', '国家级文物保护单位'],
  },
  neimenggu: {
    arch: '海拉尔俄式建筑木刻楞房',
    subtitle: '额尔古纳河右岸俄罗斯族聚落保留下来的寒地原木住宅，以整木叠砌、青苔填缝和俄式装饰凝结边境定居生活记忆',
    card: '官方名称：俄罗斯族木刻楞房，本条采用“海拉尔俄式建筑木刻楞房 / 额尔古纳木刻楞民居”作为省级代表表述；核心分布：内蒙古自治区呼伦贝尔市海拉尔区、额尔古纳市、恩和俄罗斯族民族乡、三河一带及中俄边境聚落；起源定型：19 世纪末至 20 世纪初中俄边境交流、华俄后裔聚居与森林资源利用背景下逐步形成；非遗级别：俄罗斯族木刻楞营造技艺于 2013 年列入内蒙古自治区级非物质文化遗产代表性项目名录；建筑类型：以原木为主体材料的俄式单门独院寒地木构民居；民间称号：额尔古纳河畔的木头房子、俄罗斯族传统民居、北疆木构住宅活态样本。',
    sections: [
      {
        title: '身世溯源',
        body: '内蒙古条目采用木刻楞房，而不采用蒙古包，是因为这里要表达的不是草原游牧帐幕，而是呼伦贝尔边境地区的定居型住宅传统。海拉尔、额尔古纳、恩和、三河一带处在大兴安岭余脉、额尔古纳河右岸和中俄边境文化交汇带，森林资源丰富，冬季严寒漫长，俄罗斯族和华俄后裔长期在此聚居，逐渐形成以木刻楞为代表的俄式独院住宅。“木刻楞”常被解释为用木头和手斧砍刻、叠垒而成的木房。它的形成与边境婚姻、铁路交通、林区生产、农牧生活和俄罗斯族生活习俗有关。',
      },
      {
        title: '建筑亮点',
        body: '木刻楞房最核心的营造方式，是用整根原木层层交错叠砌墙身。原木两端通过牙卯、卡槽、木楔等方式咬合固定，层与层之间填入青苔、茅蒿等保温材料，以阻隔寒风和冷空气渗入。厚重的木墙既能缓冲北方极端温差，也能在冻土和地基变化中保持一定弹性。它的平面多为单门独院式，强调家庭生活的独立性与院落秩序。屋顶可覆铁皮或木板，门檐、窗檐、房檐常有俄式雕刻和彩绘，窗框、花饰、木栏杆让厚重木屋具有鲜明的异域装饰感。',
      },
      {
        title: '历史高光',
        body: '木刻楞房的历史高光，在于它记录了内蒙古东北部边境社会的跨文化生成。额尔古纳河右岸的俄罗斯族聚落，长期处在中俄交通、婚姻、贸易与林区生产的交会处，居民在语言、饮食、节日和住宅上形成独特的华俄后裔文化。木刻楞房正是这种文化最直观的物质符号：它一眼能看出俄式木屋的轮廓，却又深深扎根于中国北疆的林地、冻土和村落生活。2013 年，俄罗斯族木刻楞营造技艺列入内蒙古自治区级非物质文化遗产代表性项目名录，说明其价值已经从“老房子”进入地方文化保护体系。',
      },
    ],
    highlights: ['俄罗斯族民居', '寒地木构住宅', '边境聚落', '自治区级非遗'],
  },
};

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
