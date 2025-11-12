/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
    output: 'export', // important for static hosting
    basePath: '/Global-Presence-Map', // your repo name
    assetPrefix: '/Global-Presence-Map/', // ensures assets load correctly
};

export default config;
