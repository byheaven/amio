// Star Ocean (星海) types, enums, and constants

export enum ContentTab {
  RECOMMEND = 'recommend',
  HOT = 'hot',
  PLANET_UPDATE = 'planet_update',
  CREATION = 'creation',
  COMPETITION = 'competition',
}

export const CONTENT_TAB_LABELS: Record<ContentTab, string> = {
  [ContentTab.RECOMMEND]: '推荐',
  [ContentTab.HOT]: '热门',
  [ContentTab.PLANET_UPDATE]: '星球动态',
  [ContentTab.CREATION]: '创作',
  [ContentTab.COMPETITION]: '赛事',
};

export enum FeedCardType {
  AI_AGGREGATED = 'ai_aggregated',
  IMAGE_TEXT_POST = 'image_text_post',
  MILESTONE = 'milestone',
  STAR_EXPRESS = 'star_express',
  OFFICIAL_CONTENT = 'official_content',
}

export interface CardInteractions {
  likes: number;
  comments: number;
  shares: number;
}

export interface PlanetPulseData {
  progress: number;
  dailyChange: number;
  onlineCount: number;
}

// --- Discriminated union for feed items ---

interface FeedItemBase {
  id: string;
  tab: ContentTab;
  interactions: CardInteractions;
  timestamp: string;
}

export interface AiAggregatedItem extends FeedItemBase {
  type: FeedCardType.AI_AGGREGATED;
  aiQuote: string;
  title: string;
  thumbnail: string;
  source: string;
}

export interface ImageTextPostItem extends FeedItemBase {
  type: FeedCardType.IMAGE_TEXT_POST;
  userName: string;
  userAvatar: string;
  content: string;
  images: string[];
}

export interface MilestoneItem extends FeedItemBase {
  type: FeedCardType.MILESTONE;
  milestoneText: string;
  participantCount: number;
  emoji: string;
}

export interface StarExpressItem extends FeedItemBase {
  type: FeedCardType.STAR_EXPRESS;
  headline: string;
  urgencyText: string;
  ctaLabel: string;
}

export interface OfficialContentItem extends FeedItemBase {
  type: FeedCardType.OFFICIAL_CONTENT;
  badge: string;
  title: string;
  summary: string;
  coverImage: string;
}

export type FeedItem =
  | AiAggregatedItem
  | ImageTextPostItem
  | MilestoneItem
  | StarExpressItem
  | OfficialContentItem;
