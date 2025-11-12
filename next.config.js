import 'dotenv/config';
const isExport = process.env.EXPORT_MODE === 'true';
const config = {
    basePath: '/Global-Presence-Map',
    assetPrefix: '/Global-Presence-Map/',
    ...(isExport ? { output: 'export' } : {}),
};
export default config;
