declare module "gifshot" {
  const gifshot: {
    createGIF: (options: any, callback: (obj: { error: boolean; image: string; errorMsg?: string }) => void) => void;
    isSupported: () => boolean;
  };
  export default gifshot;
}
