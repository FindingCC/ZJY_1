declare module "*.css" {
  const css: string;
  export default css;
}

// Allow side-effect CSS imports in server components
declare module "*.css?*" {}

