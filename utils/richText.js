/**
 * 处理富文本内容，使富文本中的图片、视频和表格自适应
 * @param {string} content 原始富文本内容
 * @returns {string} 处理后的富文本内容
 */
export function processRichText(content) {
  if (!content) {
    return '';
  }
  
  let processedContent = content;
  
  // 处理图片宽度
  processedContent = processedContent.replace(/<img[^>]*>/gi, (match) => {
    // 移除原始的宽高设置
    match = match.replace(/width="[^"]*"/gi, '');
    match = match.replace(/height="[^"]*"/gi, '');
    match = match.replace(/style="[^"]*"/gi, '');
    
    // 添加自适应样式
    match = match.replace('<img', '<img style="max-width: 100%; width: 100%; height: auto; display: block;" ');
    
    return match;
  });
  
  // 处理视频宽度
  processedContent = processedContent.replace(/<video[^>]*>/gi, (match) => {
    // 移除原始的宽高设置
    match = match.replace(/width="[^"]*"/gi, '');
    match = match.replace(/height="[^"]*"/gi, '');
    match = match.replace(/style="[^"]*"/gi, '');
    
    // 添加自适应样式
    match = match.replace('<video', '<video style="max-width: 100%; width: 100%; height: auto;" ');
    
    return match;
  });
  
  // 处理表格宽度
  processedContent = processedContent.replace(/<table[^>]*>/gi, (match) => {
    match = match.replace(/width="[^"]*"/gi, '');
    match = match.replace(/style="[^"]*"/gi, '');
    match = match.replace('<table', '<table style="width: 100%; border-collapse: collapse;" ');
    
    return match;
  });
  
  return processedContent;
} 