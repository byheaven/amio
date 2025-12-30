/**
 * Story data for Shark Star (孙颖莎) growth journey
 * Each day corresponds to a chapter in her table tennis career
 */

export interface StoryContent {
    day: number;
    title: string;
    subtitle: string;
    content: string;
    imageUrl?: string;
}

/**
 * MVP stories - 7 days of content
 * Based on Sun Yingsha's table tennis journey
 */
export const STORIES: StoryContent[] = [
    {
        day: 1,
        title: '梦想启航',
        subtitle: 'The Dream Begins',
        content: '五岁那年的夏天，小颖莎第一次走进了乒乓球馆。看着大孩子们挥拍击球的样子，她的眼睛里闪烁着好奇的光芒。这一天，一颗关于乒乓球的种子，在她心中悄然种下。',
    },
    {
        day: 2,
        title: '第一次比赛',
        subtitle: 'First Competition',
        content: '省队选拔赛上，十一岁的颖莎紧握球拍，手心微微出汗。对面是比她大两岁的选手，但她没有退缩。一板又一板，每一个回球都凝聚着她苦练的汗水。最终，她赢了。',
    },
    {
        day: 3,
        title: '国家队的门',
        subtitle: 'National Team Calling',
        content: '2015年的那个秋天，十五岁的颖莎收到了国家队的邀请。当她走进那扇门的时候，她知道，真正的挑战才刚刚开始。这里有最强的对手，也有最好的老师。',
    },
    {
        day: 4,
        title: '低谷与成长',
        subtitle: 'Through the Valley',
        content: '进入国家队的第一年并不顺利。输球、伤病、思念家人...但每一次跌倒，她都选择爬起来继续练习。深夜的训练馆里，只有她和球在对话。',
    },
    {
        day: 5,
        title: '世界舞台',
        subtitle: 'World Stage',
        content: '2019年世锦赛女双决赛，颖莎和搭档配合默契，一路过关斩将。当金牌挂在胸前的那一刻，她终于可以骄傲地说：我做到了。',
    },
    {
        day: 6,
        title: '奥运梦圆',
        subtitle: 'Olympic Dream',
        content: '东京奥运会的赛场上，颖莎代表中国队站在了最高的舞台。虽然单打决赛惜败，但她用实力证明了自己的世界级水准。银牌的重量，是未来更大梦想的起点。',
    },
    {
        day: 7,
        title: '王者之路',
        subtitle: 'Path of Champions',
        content: '2023年，颖莎登顶世界第一。从五岁的小女孩到世界冠军，她用十八年的坚持诠释了什么是梦想的力量。而这，只是开始...',
    },
];

/**
 * Get story content by day number
 * Returns null if story doesn't exist for the given day
 */
export const getStoryByDay = (day: number): StoryContent | null => {
    return STORIES.find(story => story.day === day) || null;
};

/**
 * Get total number of available stories
 */
export const getTotalStories = (): number => {
    return STORIES.length;
};
