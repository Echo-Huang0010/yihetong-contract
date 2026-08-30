<!--
 * @Description:
 * @LastEditTime: 2023-12-15 14:00:55
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-07-28 10:21:36
-->

<template>
  <div>
    <quill-editor
      ref="myQuillEditor"
      :options="editorOption"
      @blur="onEditorBlur($event)"
      @focus="onEditorFocus($event)"
      @update:content="onEditorChange($event)"
      @ready="onEditorReady($event)"
    >
    </quill-editor>
  </div>
</template>

<script lang="ts" setup>
  import { ref, reactive, watch } from 'vue';
  import { QuillEditor, Quill } from '@vueup/vue-quill';
  import '@vueup/vue-quill/dist/vue-quill.snow.css';
  import 'quill-image-uploader/dist/quill.imageUploader.min.css';
  import BlotFormatter from 'quill-blot-formatter';
  import Compressor from 'compressorjs';
  import { customPost } from '@/customComponents/api/index';
  // import ImageUploader from 'quill-image-uploader';

  // 图片压缩事件回调
  const compressImage = (file: any) => {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line no-new
      new Compressor(file, {
        quality: 0.6, // 设置压缩质量
        maxWidth: 400, // 设置图片最大宽度
        maxHeight: 400, // 设置图片最大高度
        success(result: unknown) {
          resolve(result);
        },
        error(error: any) {
          reject(error);
        },
      });
    });
  };

  // Quill.register('modules/imageUploader', ImageUploader);
  Quill.register('modules/blotFormatter', BlotFormatter);

  const props = defineProps({
    defaultValue: {
      type: String,
      default: '',
    },
    fieldData: {
      type: Object,
      default: () => {
        return {};
      },
    },
    type: {
      type: String,
      default: 'add',
    },
  });
  const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'], // 加粗，斜体，下划线，删除线
    ['blockquote', 'code-block'], // 引用，代码块
    [{ header: 1 }, { header: 2 }], // 几级标题
    [{ list: 'ordered' }, { list: 'bullet' }], // 有序列表，无序列表
    [{ script: 'sub' }, { script: 'super' }], // 下角标，上角标
    [{ indent: '-1' }, { indent: '+1' }], // 缩进
    [{ direction: 'rtl' }], // 文字输入方向
    [{ size: ['small', false, 'large', 'huge'] }], // 字体大小
    [{ header: [1, 2, 3, 4, 5, 6, false] }], // 标题
    [{ color: [] }, { background: [] }], // 颜色选择
    [
      {
        font: [
          'SimSun',
          'SimHei',
          'Microsoft-YaHei',
          'KaiTi',
          'FangSong',
          'Arial',
        ],
      },
    ], // 字体
    [{ align: [] }], // 居中
    ['clean'], // 清除样式,
    ['link', 'image'], // 上传图片、上传视频
  ];

  const myQuillEditor = ref();

  const editorOption = reactive({
    modules: {
      history: {
        delay: 1000,
        maxStack: 50,
        userOnly: false,
      },
      toolbar: {
        container: toolbarOptions,
        handlers: {
          image(value: any) {},
        },
      }, // 上传图片
      imageUploader: {
        upload: async (file: any) => {
          const compressedFile: any = await compressImage(file);
          const formData = new FormData();
          formData.append('file', compressedFile);
          console.log(formData);
          customPost(props.fieldData.upload, formData).then((res) => {
            console.log(res);
            return res.data;
          });
        },
      },
    },
    placeholder: '请输入内容...',
  });

  const nowVal = props.defaultValue || '';
  // 失去焦点事件
  const onEditorBlur = (quill: any) => {
    console.log('editor blur!', quill);
  };
  // 获得焦点事件
  const onEditorFocus = (quill: any) => {
    console.log('editor focus!', quill);
  };
  // 准备富文本编辑器
  const onEditorReady = (quill: any) => {
    console.log('editor ready!', quill);
    myQuillEditor.value.setHTML(nowVal);
  };
  watch(
    () => props.defaultValue,
    (val) => {
      const oldVal = myQuillEditor.value.getHTML();
      if (oldVal !== val) {
        myQuillEditor.value.setHTML(val);
      }
    }
  );
  const emit = defineEmits(['valChange']);
  // 内容改变事件
  const onEditorChange = (e: any) => {
    console.log('editor change!', e);
    const val = myQuillEditor.value.getHTML();
    emit('valChange', {
      fieldName: props.fieldData.fieldName,
      parentField: props.fieldData[props.type].parentField,
      val,
    });
  };
</script>

<style>
  .ql-container {
    height: 300px;
    line-height: normal;
    width: auto;
  }

  span.ql-size {
    max-width: 80px !important;
  }

  .ql-tooltip[data-mode='link']::before {
    content: '请输入链接地址:';
  }

  .ql-tooltip.ql-editing a.ql-action::after {
    border-right: 0px;
    content: '保存';
    padding-right: 0px;
  }

  .ql-tooltip[data-mode='video'] {
    left: 0 !important;
  }

  .ql-tooltip[data-mode='video']::before {
    content: '请输入视频地址:';
  }

  .ql-picker.ql-size .ql-picker-label::before,
  .ql-picker.ql-size .ql-picker-item::before {
    content: '14px';
  }

  .ql-picker.ql-size .ql-picker-label[data-value='small']::before,
  .ql-picker.ql-size .ql-picker-item[data-value='small']::before {
    content: '10px';
  }

  .ql-picker.ql-size .ql-picker-label[data-value='large']::before,
  .ql-picker.ql-size .ql-picker-item[data-value='large']::before {
    content: '18px';
  }

  .ql-picker.ql-size .ql-picker-label[data-value='huge']::before,
  .ql-picker.ql-size .ql-picker-item[data-value='huge']::before {
    content: '32px';
  }

  .ql-picker.ql-header .ql-picker-label::before,
  .ql-picker.ql-header .ql-picker-item::before {
    content: '文本';
  }

  .ql-picker.ql-header .ql-picker-label[data-value='1']::before,
  .ql-picker.ql-header .ql-picker-item[data-value='1']::before {
    content: '标题1';
  }

  .ql-picker.ql-header .ql-picker-label[data-value='2']::before,
  .ql-picker.ql-header .ql-picker-item[data-value='2']::before {
    content: '标题2';
  }

  .ql-picker.ql-header .ql-picker-label[data-value='3']::before,
  .ql-picker.ql-header .ql-picker-item[data-value='3']::before {
    content: '标题3';
  }

  .ql-picker.ql-header .ql-picker-label[data-value='4']::before,
  .ql-picker.ql-header .ql-picker-item[data-value='4']::before {
    content: '标题4';
  }

  .ql-picker.ql-header .ql-picker-label[data-value='5']::before,
  .ql-picker.ql-header .ql-picker-item[data-value='5']::before {
    content: '标题5';
  }

  .ql-picker.ql-header .ql-picker-label[data-value='6']::before,
  .ql-picker.ql-header .ql-picker-item[data-value='6']::before {
    content: '标题6';
  }

  .ql-picker.ql-font .ql-picker-label::before,
  .ql-picker.ql-font .ql-picker-item::before {
    content: '标准字体';
  }

  .ql-picker.ql-font .ql-picker-label[data-value='serif']::before,
  .ql-picker.ql-font .ql-picker-item[data-value='serif']::before {
    content: '衬线字体';
  }

  .ql-picker.ql-font .ql-picker-label[data-value='monospace']::before,
  .ql-picker.ql-font .ql-picker-item[data-value='monospace']::before {
    content: '等宽字体';
  }
</style>
