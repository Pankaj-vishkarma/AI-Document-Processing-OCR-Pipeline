const normalizePath = (path) =>
    String(path || "").replace(/\\/g, "/").replace(/^\/+/, "");

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

    return `${String(baseUrl).replace(/\/+$/, "")}/${normalizedPath}`;
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

    if (normalizedPath.startsWith(folderPrefix)) {
        return joinUrl(baseUrl, normalizedPath);
    }

    const fileName = getBasename(normalizedPath);

    return joinUrl(baseUrl, `${folder}/${fileName}`);
};

export { joinUrl, toPublicAssetUrl };