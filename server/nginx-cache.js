const Bluebird = require('bluebird');
const FS = Bluebird.promisifyAll(require('fs'));
const Crypto = require('crypto');

const nginxCache = process.env.NGINX_CACHE;

async function purge(pattern) {
    console.log(`Purging: ${pattern}`);
    let purged = [];
    if (typeof(pattern) === 'string') {
        let url = pattern;
        let hash = Crypto.createHash('md5').update(url);
        let md5 = hash.digest('hex');
        let success = await removeCacheEntry({ url, md5 });
        if (success) {
            purged.push(url);
        }
    } else if (pattern instanceof RegExp) {
        let cacheEntries = await loadCacheEntries();
        for (let cacheEntry of cacheEntries) {
            if (pattern.test(cacheEntry.url)) {
                let success = await removeCacheEntry(cacheEntry);
                if (success) {
                    purged.push(cacheEntry.url);
                }
            }
        }
    }
    return purged;
}

const isMD5 = /^[0-9a-f]{32}$/;

let cacheEntriesPromise = null;

async function loadCacheEntries() {
    if (!cacheEntriesPromise) {
        cacheEntriesPromise = loadCacheEntriesUncached();
    }
    let entries = await cacheEntriesPromise;
    cacheEntriesPromise = null;
    return entries;
}

async function loadCacheEntriesUncached() {
    let files = await FS.readdirAsync(nginxCache);
    let entries = [];
    for (let file of files) {
        if (isMD5.test(file)) {
            let entry = await loadCacheEntry(file);
            if (entry) {
                entries.push(entry);
            }
        }
    }
    return entries;
}

let cacheEntryCache = {};

async function loadCacheEntry(md5) {
    try {
        let path = `${nginxCache}/${md5}`;
        let { mtime } = await FS.statAsync(path);
        let entry = cacheEntryCache[md5];
        if (!entry || entry.mtime !== mtime) {
            let url = await loadCacheEntryKey(path);
            entry = cacheEntryCache[md5] = { url, mtime, md5 };
        }
        return entry;
    } catch (err) {
        delete cacheEntryCache[md5];
        return null;
    }
}

async function loadCacheEntryKey(path) {
    let fd = await FS.openAsync(path, 'r');
    let buf = Buffer.alloc(1024);
    let bytesRead = await FS.readAsync(fd, buf, 0, 1024, 0);
    let si = buf.indexOf('KEY:');
    let ei = buf.indexOf('\n', si);
    if (si !== -1 && ei !== -1) {
        let s = buf.toString('utf-8', si + 4, ei).trim();;
        return s;
    } else {
        throw new Error('Unable to find key');
    }
}

async function removeCacheEntry(entry) {
    try {
        delete cacheEntryCache[entry.md5];
        await FS.unlinkAsync(`${nginxCache}/${entry.md5}`);
        console.log(`Purged: ${entry.url}`);
        return true;
    } catch (err){
        return false;
    }
}

exports.purge = purge;
