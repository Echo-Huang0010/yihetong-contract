import { RouteLocationNormalized, RouteRecordRaw } from 'vue-router';
import { useAppStore, useUserStore } from '@/store';

export default function usePermission() {
  const userStore = useUserStore();
  const appStore = useAppStore();

  const featureEnabled = (route: RouteLocationNormalized | RouteRecordRaw) => {
    const { matched } = route as RouteLocationNormalized;
    const records = matched?.length ? matched : [route as RouteRecordRaw];
    return !records.some((record) => {
      const featureKey = record.meta?.featureKey;
      return featureKey && appStore.business?.[featureKey] === false;
    });
  };

  return {
    accessRouter(route: RouteLocationNormalized | RouteRecordRaw) {
      return (
        featureEnabled(route) &&
        (!route.meta?.requiresAuth ||
          !route.meta?.roles ||
          route.meta?.roles?.includes('*') ||
          route.meta?.roles?.includes(userStore.roles))
      );
    },
    findFirstPermissionRoute(_routers: any, role = 'admin') {
      const cloneRouters = [..._routers];
      while (cloneRouters.length) {
        const firstElement = cloneRouters.shift();
        if (firstElement && featureEnabled(firstElement)) {
          if (
            firstElement?.meta?.roles?.find((el: string[]) => {
              return el.includes('*') || el.includes(role);
            })
          )
            return { name: firstElement.name };
          if (firstElement?.children) {
            cloneRouters.push(...firstElement.children);
          }
        }
      }
      return null;
    },
    // You can add any rules you want
  };
}
