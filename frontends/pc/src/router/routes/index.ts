import type { RouteRecordNormalized } from 'vue-router';

// // 业务模块
// import Dashboard from './modules/dashboard';
// import Visualization from './modules/visualization';
// import Custom from './modules/custom';
// import Contract from './modules/contract';

const modules = import.meta.glob('./modules/*.ts', { eager: true });
const externalModules = import.meta.glob('./externalModules/*.ts', {
  eager: true,
});

function formatModules(_modules: any, result: RouteRecordNormalized[]) {
  Object.keys(_modules).forEach((key) => {
    const defaultModule = _modules[key].default;
    if (!defaultModule) return;
    const moduleList = Array.isArray(defaultModule)
      ? [...defaultModule]
      : [defaultModule];
    result.push(...moduleList);
  });
  return result.sort((a: any, b: any) => {
    const order1 = a.meta?.order || '';
    const order2 = b.meta?.order || '';
    // eslint-disable-next-line no-unsafe-optional-chaining
    return order1 - order2;
  });
}

export const appRoutes: RouteRecordNormalized[] = formatModules(modules, []);

export const appExternalRoutes: RouteRecordNormalized[] = formatModules(
  externalModules,
  []
);

// const appRoutes = [Dashboard, Visualization, Custom, Contract];
