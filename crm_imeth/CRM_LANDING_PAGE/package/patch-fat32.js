// Polyfill for Node.js 22/24 libuv bug on Windows FAT32 filesystems
// On FAT32, Windows returns ERROR_INVALID_FUNCTION/NOT_A_REPARSE_POINT, which libuv in Node 24 maps to EISDIR instead of EINVAL.
// Webpack expects EINVAL to signify that a file is not a symlink.
const fs = require('fs');

const origReadlinkSync = fs.readlinkSync;
fs.readlinkSync = function (p, options) {
  try {
    return origReadlinkSync.call(fs, p, options);
  } catch (err) {
    if (err && err.code === 'EISDIR') {
      err.code = 'EINVAL';
    }
    throw err;
  }
};

const origReadlink = fs.readlink;
fs.readlink = function (p, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  return origReadlink.call(fs, p, options, (err, linkString) => {
    if (err && err.code === 'EISDIR') {
      err.code = 'EINVAL';
    }
    if (callback) callback(err, linkString);
  });
};

if (fs.promises && fs.promises.readlink) {
  const origPromisesReadlink = fs.promises.readlink;
  fs.promises.readlink = async function (p, options) {
    try {
      return await origPromisesReadlink.call(fs.promises, p, options);
    } catch (err) {
      if (err && err.code === 'EISDIR') {
        err.code = 'EINVAL';
      }
      throw err;
    }
  };
}
