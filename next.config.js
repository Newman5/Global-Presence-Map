import 'dotenv/config';

const isExport =
    process.env.NEXT_PUBLIC_EXPORT_MODE === 'true' ||
    process.env.EXPORT_MODE === 'true';

const config = {
    ...(isExport
        ? {
            output: 'export',
            basePath: '/Global-Presence-Map',
            assetPrefix: '/Global-Presence-Map/',
        }
        : {}),
};

export default config;
