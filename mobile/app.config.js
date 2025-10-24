export default ({ config }) => ({
    ...config,
    extra: {
        EXPO_PUBLIC_API_URL: process.env.API_URL,
    },
});
