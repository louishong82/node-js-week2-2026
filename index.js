const http = require('node:http');
const fs = require('node:fs');
const { formidable } = require('formidable');  // formidable v3 用 named import

// ========== 任務一：讀取上傳設定 ==========
/**
 * 從 process.env 讀取上傳相關設定，回傳設定物件。
 *
 * 規則：
 *   - UPLOAD_DIR 未設定 → 預設 '/tmp'
 *   - MAX_FILE_SIZE_MB 未設定 → 預設 5（MB）
 *   - GYM_NAME 未設定 → 預設 '未命名健身房'
 *
 * 回傳物件：
 *   - uploadDir: 上傳目錄（字串）
 *   - maxFileSize: 最大檔案大小（bytes，= MB * 1024 * 1024）
 *   - gymName: 健身房名稱（字串）
 *
 * @returns {{uploadDir: string, maxFileSize: number, gymName: string}}
 *
 * @example
 *   process.env.UPLOAD_DIR = '/tmp/uploads';
 *   process.env.MAX_FILE_SIZE_MB = '10';
 *   process.env.GYM_NAME = 'FitClub';
 *   getUploadConfig();
 *   // { uploadDir: '/tmp/uploads', maxFileSize: 10485760, gymName: 'FitClub' }
 */
function getUploadConfig() {
  // TODO: 實作此函式
  // 提示：用 || 給預設值；MAX_FILE_SIZE_MB 是字串，記得先 Number() 轉型再換算 bytes
  const maxFileSize = (Number(process.env.MAX_FILE_SIZE_MB) || 5) *1024*1024
  return {
    uploadDir: process.env.UPLOAD_DIR || '/tmp',
    maxFileSize,
    gymName: process.env.GYM_NAME || '未命名健身房'
  }
}

// ========== 任務二：取副檔名 ==========
/**
 * 從檔名取副檔名，一律回小寫帶 `.`。
 *
 * 規則：
 *   - 'cat.jpg' → '.jpg'
 *   - 'PHOTO.JPG' → '.jpg'（一律小寫）
 *   - 'README' → ''（沒有副檔名）
 *   - 'archive.tar.gz' → '.gz'（只取最後一個）
 *
 * @param {string} filename
 * @returns {string}
 *
 * @example
 *   getFileExtension('cat.jpg');     // '.jpg'
 *   getFileExtension('PHOTO.JPG');   // '.jpg'
 *   getFileExtension('README');      // ''
 */
function getFileExtension(filename) {
  // TODO: 實作此函式
  // 提示：用 lastIndexOf('.') 找最後一個 .，toLowerCase() 轉小寫
  const index = filename.lastIndexOf('.');
  const extension = filename.slice(index).toLowerCase()
  if(index !== -1 ){
    return extension ;
  }else{
    return  '' ;
  }
}

// ========== 任務三：解析檔案 metadata ==========
/**
 * 吃 formidable 解析後的 file 物件，回傳整理好的 metadata。
 *
 * formidable 的 file 物件至少有：
 *   - originalFilename: 原始檔名
 *   - size: 檔案 byte 數
 *
 * 回傳：
 *   - filename: 原始檔名
 *   - sizeKB: 檔案大小換成 KB（四捨五入，用 Math.round）
 *   - ext: 副檔名（用任務二的 getFileExtension）
 *
 * @param {{originalFilename: string, size: number}} file
 * @returns {{filename: string, sizeKB: number, ext: string}}
 *
 * @example
 *   parseFileMetadata({ originalFilename: 'leo.jpg', size: 250000 });
 *   // { filename: 'leo.jpg', sizeKB: 244, ext: '.jpg' }
 */
function parseFileMetadata(file) {
  // TODO: 實作此函式
  // 提示：呼叫 getFileExtension 取副檔名，Math.round(size / 1024) 算 KB
  const filename = file.originalFilename
  const sizeKB = Math.round(file.size/1024)
  const ext = getFileExtension(filename)
  return {
    filename,
    sizeKB,
    ext
  }
}

// ========== 任務四：產出 upload log 字串 ==========
/**
 * 吃 metadata + config，產出一行 log 字串。
 *
 * 格式：`[{gymName}] Uploaded {filename} ({sizeKB} KB) → {uploadDir}`
 *
 * @param {{filename: string, sizeKB: number}} meta
 * @param {{uploadDir: string, gymName: string}} config
 * @returns {string}
 *
 * @example
 *   formatUploadLog(
 *     { filename: 'leo.jpg', sizeKB: 245, ext: '.jpg' },
 *     { uploadDir: '/tmp/uploads', gymName: 'FitClub' }
 *   );
 *   // '[FitClub] Uploaded leo.jpg (245 KB) → /tmp/uploads'
 */
function formatUploadLog(meta, config) {
  // TODO: 實作此函式
  // 提示：用 template literal 組字串
  return `[FitClub] Uploaded ${meta.filename} (${meta.sizeKB} KB) → ${config.uploadDir}`

}

// ========== 任務五：路由分派 ==========
/**
 * 吃 HTTP request / response / config，依 method + url 分派到對應處理邏輯。
 *
 * 規格：
 *   - POST /coaches/avatar：
 *     * 用 formidable 解析 multipart/form-data
 *     * 成功 → 回 200 + JSON { filename, sizeKB, ext, savedPath }
 *     * formidable 解析錯誤（含超過 maxFileSize）→ 回 500 + JSON { error }
 *     * 沒 file 欄位 → 回 400 + JSON { error: 'No file uploaded' }
 *   - 其他路徑 → 回 404 + JSON { error: 'Not Found' }
 *
 * formidable 設定：
 *   - uploadDir / maxFileSize 從 config 取
 *   - keepExtensions: true
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {{uploadDir: string, maxFileSize: number, gymName: string}} config
 * @returns {void} 直接操作 res 回寫、不 return 值
 *
 * @example
 *   // 在 createUploadServer 裡：
 *   http.createServer((req, res) => router(req, res, config))
 */
function router(req, res, config) {
  // TODO: 實作此函式
  // 建議（非強制）：
  //   - 拆出 handleUpload(req, res, config)：formidable 解析邏輯
  //   - 拆出 handleNotFound(req, res)：404 邏輯
  //   - router 只看 method + url、呼叫對應 handler
  // formidable 錯誤處理要點：
  //   - 錯誤解析（例如：maxFileSize）會進到 form.parse 的 callback err，因此錯誤回應（res）可撰寫在這個 callback
  //   - form.on('error', ...) 不需再處理 res 相關，避免產生回應兩次的錯誤。這個部分可用來紀錄 log、清理暫存檔、額外監控等等。目前可先有此概念即可，或者初步撰寫如下：
  //     form.on('error', (err) => {
  //       console.log(err); // 記錄 log、清理暫存檔、額外監控可以寫在這邊
  //     });  
  function  handleUpload(req, res, config){
    const form = formidable({
      uploadDir:config.uploadDir,
      maxFileSize:config.maxFileSize,
      keepExtensions: true
    })
    
    form.parse(req,(err,fields,flies)=>{
      if(err){
        res.writeHead(500,{'Content-type':'application/json'});
        res.write(JSON.stringify({'error': err.message}));
        res.end();
      }else if (!flies.file?.[0]){
        res.writeHead(400,{'Content-type':'application/json'});
        res.write(JSON.stringify({'error':'No file uploaded'}));
        res.end();
      }else{
        const file = flies.file?.[0]
        const { filename,sizeKB,ext } = parseFileMetadata(file)
        const savedPath = file.filepath
        res.writeHead(200,{'Content-type':'application/json'});
        res.write(JSON.stringify({
          filename,
          sizeKB,
          ext,
          savedPath
        }));
        res.end();
      }
    })
  }

  function handleNotFound(req,res){
    res.writeHead(404,{'Content-type':'application/json'})
    res.write(JSON.stringify({'error':'Not Found'}))
    res.end()
  }

  if( req.url === '/coaches/avatar' && req.method === 'POST'){
    handleUpload(req, res, config)
  }else{
    handleNotFound(req,res)
  }

}

// ========== 任務六：建立上傳 server ==========
/**
 * 建 http.Server、把每個 request 交給 router。
 *
 * 規格：
 *   - 如果 config.uploadDir 不存在，用 fs.mkdirSync(uploadDir, { recursive: true }) 自動建
 *   - http.createServer(...) 把 request 交給 router(req, res, config)
 *   - 回傳 server instance（不要 server.listen()，那是 app.js 的責任）
 *
 * @param {{uploadDir: string, maxFileSize: number}} config
 * @returns {http.Server}
 *
 * @example
 *   const server = createUploadServer({ uploadDir: '/tmp', maxFileSize: 5 * 1024 * 1024 });
 *   server.listen(3000);  // ← 這行由 app.js 呼叫
 */
function createUploadServer(config) {
  // TODO: 實作此函式
  // 提示：主邏輯都在 router 裡，這邊函式內容不多
  fs.mkdirSync(config.uploadDir, { recursive: true })
  const server = http.createServer((req,res)=>{ router(req, res,config) })
  return server
}

module.exports = {
  getUploadConfig,
  getFileExtension,
  parseFileMetadata,
  formatUploadLog,
  router,
  createUploadServer,
};
