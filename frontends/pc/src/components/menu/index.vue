<!--
 * @Description:
 * @LastEditTime: 2023-02-24 18:36:05
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-02-24 17:34:15
-->
<script lang="tsx">
  import { defineComponent, ref, h, compile, computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRoute, useRouter, RouteRecordRaw } from 'vue-router';
  import type { RouteMeta } from 'vue-router';
  import { useAppStore } from '@/store';
  import { listenerRouteChange } from '@/utils/route-listener';
  import { openWindow, regexUrl } from '@/utils';
  import useMenuTree from './use-menu-tree';

  // 菜单图标映射
  const menuIconMap: Record<string, { checked: string; unchecked: string }> = {
    'user-manager': {
      checked: '/images/ic_user_manage_checked.svg',
      unchecked: '/images/ic_user_manager_unchecked.svg',
    },
    'handling-contract': {
      checked: '/images/ic_handling_contract_checked.svg',
      unchecked: '/images/ic_handling_contract_unchecked.svg',
    },
    'sign-contract': {
      checked: '/images/ic_sign_contract_checked.svg',
      unchecked: '/images/ic_sign_contract_unchecked.svg',
    },
    'company-contract': {
      checked: '/images/ic_company_contract_checked.svg',
      unchecked: '/images/ic_company_contract_unchecked.svg',
    },
    '用户管理': {
      checked: '/images/ic_user_manage_checked.svg',
      unchecked: '/images/ic_user_manager_unchecked.svg',
    },
    '经办合同': {
      checked: '/images/ic_handling_contract_checked.svg',
      unchecked: '/images/ic_handling_contract_unchecked.svg',
    },
    '合同签署': {
      checked: '/images/ic_sign_contract_checked.svg',
      unchecked: '/images/ic_sign_contract_unchecked.svg',
    },
    '企业合同': {
      checked: '/images/ic_company_contract_checked.svg',
      unchecked: '/images/ic_company_contract_unchecked.svg',
    },
  };

  export default defineComponent({
    emit: ['collapse'],
    setup() {
      const { t } = useI18n();
      const appStore = useAppStore();
      const router = useRouter();
      const route = useRoute();
      const { menuTree } = useMenuTree();
      const collapsed = computed({
        get() {
          if (appStore.device === 'desktop') return appStore.menuCollapse;
          return false;
        },
        set(value: boolean) {
          appStore.updateSettings({ menuCollapse: value });
        },
      });

      const topMenu = computed(() => appStore.topMenu);
      const openKeys = ref<string[]>([]);
      const selectedKey = ref<string[]>([]);

      const goto = (item: RouteRecordRaw) => {
        // Open external link
        if (regexUrl.test(item.path)) {
          openWindow(item.path);
          selectedKey.value = [item.name as string];
          return;
        }
        // Eliminate external link side effects
        const { activeMenu } = item.meta as RouteMeta;
        if (route.name === item.name && !activeMenu) {
          selectedKey.value = [item.name as string];
          return;
        }
        // Trigger router change
        router.push({
          name: item.name,
        });
      };
      const findMenuOpenKeys = (target: string) => {
        const result: string[] = [];
        let isFind = false;
        const backtrack = (item: RouteRecordRaw, keys: string[]) => {
          if (item.name === target) {
            isFind = true;
            result.push(...keys);
            return;
          }
          if (item.children?.length) {
            item.children.forEach((el) => {
              backtrack(el, [...keys, el.name as string]);
            });
          }
        };
        menuTree.value.forEach((el: RouteRecordRaw) => {
          if (isFind) return; // Performance optimization
          backtrack(el, [el.name as string]);
        });
        return result;
      };
      listenerRouteChange((newRoute) => {
        const { requiresAuth, activeMenu, hideInMenu } = newRoute.meta;
        if (requiresAuth && (!hideInMenu || activeMenu)) {
          const menuOpenKeys = findMenuOpenKeys(
            (activeMenu || newRoute.name) as string
          );

          const keySet = new Set([...menuOpenKeys, ...openKeys.value]);
          openKeys.value = [...keySet];

          // 只保存最终选中的菜单项，不包括父级菜单
          selectedKey.value = [
            activeMenu || newRoute.name as string,
          ];
          
        }
      }, true);
      const setCollapse = (val: boolean) => {
        if (appStore.device === 'desktop')
          appStore.updateSettings({ menuCollapse: val });
      };

      // 获取菜单图标
      const getMenuIcon = (routeName: string, isSelected: boolean) => {
        // 直接使用原始的routeName尝试获取图标
        if (menuIconMap[routeName]) {
          const iconPath = isSelected ? menuIconMap[routeName].checked : menuIconMap[routeName].unchecked;
          return () => (
            <img 
              src={iconPath} 
              class="menu-icon"
              style="position: relative; z-index: 1;"
            />
          );
        }
        
        // 尝试使用转换后的key
        const iconKey = routeName.toLowerCase().replace('menu.', '');
        if (menuIconMap[iconKey]) {
          const iconPath = isSelected ? menuIconMap[iconKey].checked : menuIconMap[iconKey].unchecked;
          return () => (
            <img 
              src={iconPath} 
              class="menu-icon"
              style="position: relative; z-index: 1;"
            />
          );
        }
        
        // 如果没有找到匹配的图标，根据路由名称尝试猜测图标
        const routeNameLower = routeName.toLowerCase();
        
        // 针对中文菜单名称的判断
        if (routeName.includes('用户') || routeName.includes('成员')) {
          const iconPath = isSelected 
            ? '/images/ic_user_manage_checked.svg' 
            : '/images/ic_user_manager_unchecked.svg';
          return () => <img src={iconPath} class="menu-icon" style="position: relative; z-index: 1;" />;
        }
        
        if (routeName.includes('经办') || routeNameLower.includes('handling')) {
          const iconPath = isSelected 
            ? '/images/ic_handling_contract_checked.svg' 
            : '/images/ic_handling_contract_unchecked.svg';
          return () => <img src={iconPath} class="menu-icon" style="position: relative; z-index: 1;" />;
        }
        
        if (routeName.includes('签署') || routeNameLower.includes('sign')) {
          const iconPath = isSelected 
            ? '/images/ic_sign_contract_checked.svg' 
            : '/images/ic_sign_contract_unchecked.svg';
          return () => <img src={iconPath} class="menu-icon" style="position: relative; z-index: 1;" />;
        }
        
        if (routeName.includes('企业') || routeNameLower.includes('company')) {
          const iconPath = isSelected 
            ? '/images/ic_company_contract_checked.svg' 
            : '/images/ic_company_contract_unchecked.svg';
          return () => <img src={iconPath} class="menu-icon" style="position: relative; z-index: 1;" />;
        }
        
        // 调试信息
        
        return null;
      };

      const renderSubMenu = () => {
        function travel(_route: RouteRecordRaw[], nodes = [], level = 0) {
          if (_route) {
            _route.forEach((element) => {
              // 修改选中逻辑，对于一级菜单，只有当完全匹配当前路由时才标记为选中
              // 对于二级菜单，保持原有逻辑
              const isExactSelected = selectedKey.value.includes(element?.name as string);
              // 一级菜单只有在精确匹配时才显示选中状态
              const isSelected = level === 0 ? 
                (element?.name === selectedKey.value[0]) : 
                isExactSelected;
                
              const routeLocale = element?.meta?.locale || '';
              
              // 自定义图标逻辑
              let icon = null;
              if (level === 0) {
                // 一级菜单使用自定义图标
                icon = getMenuIcon(routeLocale, isSelected);
                
                // 如果没有找到图标，尝试使用t函数翻译后的文本查找
                if (!icon && t) {
                  const translatedText = t(routeLocale);
                  icon = getMenuIcon(translatedText, isSelected);
                }
              } else if (element?.meta?.icon) {
                // 使用原有图标
                icon = () => h(compile(`<${element?.meta?.icon}/>`));
              }

              const node =
                element?.children && element?.children.length !== 0 ? (
                  <a-sub-menu
                    key={element?.name}
                    class={`menu-item-level-${level} ${isSelected ? 'menu-item-selected' : ''}`}
                    v-slots={{
                      icon,
                      title: () => (
                        <span class={`menu-item-title ${level === 1 ? 'submenu-title' : ''}`}>
                          {t(routeLocale)}
                        </span>
                      ),
                    }}
                  >
                    {travel(element?.children, [], level + 1)}
                  </a-sub-menu>
                ) : (
                  <a-menu-item
                    key={element?.name}
                    class={`menu-item-level-${level} ${isExactSelected ? 'menu-item-selected custom-selected' : ''}`}
                    v-slots={{ 
                      icon: level === 1 ? () => (
                        <span class="submenu-dot"></span>
                      ) : icon
                    }}
                    onClick={() => goto(element)}
                  >
                    <span class={`menu-item-title ${level === 1 ? 'submenu-title' : ''}`}>
                      {t(routeLocale)}
                    </span>
                  </a-menu-item>
                );
              nodes.push(node as never);
            });
          }
          return nodes;
        }
        return travel(menuTree.value);
      };

      return () => (
        <a-menu
          mode={topMenu.value ? 'horizontal' : 'vertical'}
          v-model:collapsed={collapsed.value}
          v-model:open-keys={openKeys.value}
          show-collapse-button={appStore.device !== 'mobile'}
          auto-open={false}
          selected-keys={selectedKey.value}
          auto-open-selected={true}
          level-indent={34}
          class="custom-menu"
          style="height: 100%;width:100%;"
          onCollapse={setCollapse}
        >
          {renderSubMenu()}
        </a-menu>
      );
    },
  });
</script>

<style lang="less" scoped>
  :deep(.arco-menu-inner) {
    .arco-menu-inline-header {
      display: flex;
      align-items: center;
      color: var(--color-text-2)
    }
    .arco-icon {
      color: var(--color-text-2)
    }
    .arco-icon {
      &:not(.arco-icon-down) {
        font-size: 18px;
        color: var(--color-text-2)
      }
    }
  }

  :deep(.custom-menu) {
    .menu-item-selected {
      position: relative;
      
      &.menu-item-level-0::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-image: url('/images/bg_menu_check.svg');
        background-repeat: no-repeat;
        background-position: right center;
        z-index: -1;
      }
      
      &.menu-item-level-0 {
        color: #FFFFFF !important;
        background-color: transparent !important;
        position: relative;
        
        .menu-item-title {
          color: #FFFFFF !important;
          position: relative;
          z-index: 1;
        }
        
        &.arco-menu-item.arco-menu-selected {
          color: #FFFFFF !important;
          background-color: transparent !important;
        }
      }
      
      // 二级菜单选中样式
      &.menu-item-level-1 {
        position: relative;
        
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-image: url('/images/bg_menu_check.svg');
          background-repeat: no-repeat;
          background-position: right center;
          z-index: -1;
        }
        
        .menu-item-title {
          color: #FFFFFF !important;
          position: relative;
          z-index: 1;
        }
        
        .submenu-dot {
          background-color: #FFFFFF !important;
        }
      }
    }
    
    // 覆盖Arco Design默认样式
    .arco-menu-item.arco-menu-selected.menu-item-level-0 {
      color: #FFFFFF !important;
      background-color: transparent !important;
    }
    
    // 二级菜单选中样式覆盖
    .arco-menu-item.arco-menu-selected.menu-item-level-1 {
      color: #FFFFFF !important;
      background-color: transparent !important;
    }
    
    .submenu-title {
      color: #999999;
      font-size: 14px;
    }
    
    .submenu-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #D1D1D1;
      margin-right: 8px;
      position: relative;
      z-index: 1;
    }
    
    .menu-icon {
      width: 20px;
      height: 20px;
      margin-right: 10px;
      display: inline-block;
      vertical-align: middle;
      position: relative;
      z-index: 1;
    }
  }
</style>
