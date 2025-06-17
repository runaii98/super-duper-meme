export default {
  logo: (
    <div className="flex items-center">
      <img src="/logo.png" alt="ComfyUI" className="h-8 w-8 mr-2" />
      <span className="font-bold text-xl">ComfyUI Docs</span>
    </div>
  ),
  project: {
    link: 'https://github.com/yourusername/comfy-ui'
  },
  docsRepositoryBase: 'https://github.com/yourusername/comfy-ui/tree/main/docs',
  useNextSeoProps() {
    return {
      titleTemplate: '%s – ComfyUI Documentation'
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="ComfyUI Documentation" />
      <meta property="og:description" content="The most developer-friendly platform for deploying and scaling applications worldwide." />
    </>
  ),
  primaryHue: 151,
  primarySaturation: 100,
  navigation: true,
  darkMode: true,
  footer: {
    text: `© ${new Date().getFullYear()} ComfyUI. All rights reserved.`
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    autoCollapse: true,
    titleComponent: ({ title, type }) => <>{title}</>,
  },
  toc: {
    float: true,
    title: 'On This Page'
  }
}; 