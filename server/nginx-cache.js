const Bluebird = require('bluebird');
const FS = Bluebird.promisifyAll(require('fs'));
const Crypto = require('crypto');

const NGINX_CACHE = process.env.NGINX_CACHE;

async function purge(pattern) {
    console.log(`Purging: ${pattern}`);
    let purged = [];
    if (typeof(pattern) === 'string') {
        let url = pattern;
        let md5 = Crypto.createHash('md5').update(url).digest('hex');
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
    let files = await FS.readdirAsync(NGINX_CACHE);
    let entries = [];
    for (let file of files) {
        if (/^[0-9a-f]{32}$/.test(file)) {
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
        let path = `${NGINX_CACHE}/${md5}`;
        let { mtime, size } = await FS.statAsync(path);
        let entry = cacheEntryCache[md5];
        if (!entry || entry.mtime !== mtime) {
            let url = await loadCacheEntryKey(path);
            entry = cacheEntryCache[md5] = { url, md5, mtime, size };
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
        await FS.unlinkAsync(`${NGINX_CACHE}/${entry.md5}`);
        console.log(`Purged: ${entry.url}`);
        return true;
    } catch (err){
        return false;
    }
}

module.exports = {
    purge,
    read: loadCacheEntries,
};
