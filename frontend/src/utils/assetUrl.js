const normalizePath = (path) =>
    String(path || "").replace(/\\/g, "/").replace(/^\/+/, "");

const normalizeBaseUrl = (baseUrl) =>
    String(baseUrl || "").replace(/\/+$/, "");

const joinUrl = (baseUrl, path) => {
    if (!path) {
        return "";
    }

    if (/^(https?:|blob:|data:)/.test(path)) {
        return path;
    }

    const normalizedPath = normalizePath(path);

    if (!baseUrl) {
        return `/${normalizedPath}`;
    }

    return `${normalizeBaseUrl(baseUrl)}/${normalizedPath}`;
};

const getBasename = (path) => {
    const normalizedPath = normalizePath(path);
    const parts = normalizedPath.split("/").filter(Boolean);

    return parts[parts.length - 1] || "";
};

const toPublicAssetUrl = (path, folder, baseUrl = "") => {
    if (!path) {
        return "";
    }

    if (/^(https?:|blob:|data:)/.test(path)) {
        return path;
    }

    const normalizedPath = normalizePath(path);
    const folderPrefix = `${folder}/`;
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

    if (normalizedPath.startsWith(folderPrefix)) {
        if (
            normalizedBaseUrl.endsWith(`/${folder}`) ||
            normalizedBaseUrl.endsWith(folder)
        ) {
            return `${normalizedBaseUrl}/${normalizedPath.slice(folderPrefix.length)}`;
        }

        return joinUrl(normalizedBaseUrl, normalizedPath);
    }

    const fileName = getBasename(normalizedPath);

    return joinUrl(normalizedBaseUrl, `${folder}/${fileName}`);
};

export { joinUrl, toPublicAssetUrl };