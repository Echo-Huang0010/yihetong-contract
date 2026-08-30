<!--
 * @Description:
 * @LastEditTime: 2023-12-14 19:18:48
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-01 15:52:13
-->
<template>
  <tipModal ref="tipModalComp" @get-data="$emit('getData')"></tipModal>
  <customModal
    ref="customModalComp"
    :field-list="fieldList"
    @get-data="$emit('getData')"
  ></customModal>
</template>

<script lang="ts" setup>
  import { ref, PropType } from 'vue';
  import { useRouter } from 'vue-router';
  import { customRequest } from '@/customComponents/api/index';
  import axios from 'axios';
  import { Message } from '@arco-design/web-vue';
  import tipModal from './tipModal/index.vue';
  import customModal from './customModal/index.vue';

  const emit = defineEmits(['getData']);

  interface formModelType {
    [x: string]: any;
  }
  defineProps({
    fieldList: {
      type: Array as PropType<formModelType[]>,
      default: () => {
        return [];
      },
    },
  });
  const router = useRouter();
  const tipModalComp = ref();
  const customModalComp = ref();

  interface commonList {
    [index: number]: any;
  }
  interface commonRecord {
    [x: string]: any | commonList;
  }
  // eslint-disable-next-line no-undef
  const downloadFile = (fileUrl: string, name: string) => {
    axios
      .get<Blob>(fileUrl, {
        responseType: 'blob',
      })
      .then((res) => {
        console.log('11111111111');
        console.log(res);
        const content = new Blob([res.data], {});
        // 兼容性处理
        const urlObject = window.URL || window.webkitURL || window;
        // 获取下载地址href的指向
        const url = urlObject.createObjectURL(content);
        // 创建a元素
        const a = document.createElement('a');
        // 给a元素的href添加下载后端传递过来的文件
        a.href = url;
        // 给下载的文件添加名字，下面是我写死的，如果后端给的每一个文件名都不一样，可以通过res获取文件名，然后给数据
        a.download = name;
        // 给生成的a元素绑定单击事件
        a.click();
        // 静态方法用来释放一个之前已经存在的、通过调用 URL.createObjectURL() 创建的 URL 对象。当你结束使用某个 URL 对象之后，应该通过调用这个方法来让浏览器知道不用在内存中继续保留对这个文件的引用了。
        urlObject.revokeObjectURL(url);
      })
      .catch((err) => {});
  };
  const optClick = (e: any) => {
    console.log(e.record);
    console.log(e.operate);
    if (e.operate.link) {
      if (e.operate.link.back) {
        router.back();
      } else if (e.operate.link.openItem) {
        if (e.record) {
          let isHave = false;
          e.operate.link.params?.forEach((item: any) => {
            if (e.record[item]) {
              window.open(e.record[item]);
              isHave = true;
            }
          });
          if (!isHave) {
            Message.error('暂无链接');
          }
        }
      } else if (e.operate.link.iframeH5) {
        if (e.record) {
          let isHave = false;
          e.operate.link.params?.forEach((item: any) => {
            if (e.record[item]) {
              let path = e.operate.link.iframeH5;
              if (e.operate.link.iframeParams) {
                const url = encodeURIComponent(e.record[item]);
                const str = `?${e.operate.link.iframeParams}=${url}`;
                path += str;
              }
              console.log(path);
              window.open(path, '_blank');
              isHave = true;
            }
          });
          if (!isHave) {
            Message.error('暂无链接');
          }
        }
      } else {
        const params = {};
        if (e.record) {
          e.operate.link.params?.forEach((item: any) => {
            params[item] = e.record[item];
          });
        }
        router.push({ path: e.operate.link.url, query: params });
      }
    } else if (e.operate.tip) {
      tipModalComp.value.show(e.operate.tip, e.record);
    } else if (e.operate.customModal) {
      customModalComp.value.show(e.operate, e.record);
    } else if (e.operate.download) {
      if (e.operate.download.useType === 'link') {
        // window.open(e.record[e.operate.download.params]);
        downloadFile(
          e.record[e.operate.download.params],
          e.record[e.operate.download.fileName] + e.operate.download.fileAfter
        );
      } else if (e.operate.download.useType === 'request') {
        const params = {};
        if (e.record.selectedKeys) {
          if (e.record.selectedKeys.length > 0) {
            e.operate.download.requestParams?.forEach((item: any) => {
              params[item] = e.record.selectedKeys;
            });
          } else {
            Message.warning('请选择数据');
            return;
          }
        }
        customRequest(e.operate.download, { ...e.record, ...params }).then(
          (res) => {
            downloadFile(
              res.data[e.operate.download.params],
              res.data[e.operate.download.fileName] +
                e.operate.download.fileAfter
            );
          }
        );
      }
    } else if (e.operate.filePreview) {
      // window.open(
      //   `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
      //     e.operate[e.operate.filePreview.params]
      //   )}`
      // );
      customRequest(e.operate.filePreview, e.record).then((res) => {
        if (res.data[e.operate.filePreview.params]) {
          window.open(res.data[e.operate.filePreview.params]);
        } else {
          Message.warning('暂无链接');
        }
      });
    }
  };
  defineExpose({
    optClick,
  });
</script>

<style lang="less" scoped></style>
