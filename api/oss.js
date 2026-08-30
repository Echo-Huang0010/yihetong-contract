import { upload as uploadByApi } from '@/api/upload.js';

function uploadViaApi(fileList = [], field = 'url') {
  if (!fileList.length) {
    return Promise.resolve([]);
  }
  const backList = [];
  return fileList.reduce((queue, file) => {
    return queue.then(() => uploadByApi(file, '/upload/v1/oss').then(url => {
      if (!url) {
        return Promise.reject(new Error('upload failed'));
      }
      const uploadedFile = {
        name: file.name || file.fileName || '',
        size: file.size || 0,
        type: file.type || '',
        path: file.path || file.tempFilePath || '',
      };
      uploadedFile[field] = url;
      backList.push(uploadedFile);
    }));
  }, Promise.resolve()).then(() => backList);
}
/***
  @param [fileList]
   参数示例：
   [{
      path: "http://tmp/6k7p2ZpyEzru43a2e0754a8175458dca10617de53558.png"
      size: 998099
    },
    ...其他参数自定义，上传成功后会照常返回
  ]
  @param 'field' 上传后返回的附件key值 默认url
***/
export function upload(fileList = [], field = 'url') {
  return uploadViaApi(fileList, field)
}
