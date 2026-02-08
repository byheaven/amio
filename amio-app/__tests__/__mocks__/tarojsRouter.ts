export const history = {
  location: {
    pathname: '/',
    search: '',
    hash: '',
    key: '0',
    state: null,
  },
  push: () => {},
  replace: () => {},
  go: () => {},
  back: () => {},
  forward: () => {},
  listen: () => () => {},
  block: () => () => {},
};

export const getCurrentPages = () => [];
export const navigateBack = async () => {};
export const navigateTo = async () => {};
export const reLaunch = async () => {};
export const redirectTo = async () => {};
export const switchTab = async () => {};

export const setTitle = () => {};
export const setNavigationBarLoading = () => {};
export const setNavigationBarStyle = () => {};
export const setMpaTitle = () => {};

export const isDingTalk = () => false;
export const isWeixin = () => false;

export const createBrowserHistory = () => history;
export const createHashHistory = () => history;
export const createMpaHistory = () => history;
export const prependBasename = (url = '') => url;
export const setHistory = () => {};
export const setHistoryMode = () => {};

export const routesAlias = {};

export const createRouter = () => ({});
export const createMultiRouter = () => ({});
export const handleAppMount = () => {};
export const handleAppMountWithTabbar = () => {};
