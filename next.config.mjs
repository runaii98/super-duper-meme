import nextra from 'nextra';

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
  defaultShowCopyCode: true,
  flexsearch: {
    codeblocks: true
  },
  staticImage: true,
  latex: true,
  mdxOptions: {
    remarkPlugins: [],
    rehypePlugins: []
  }
});

export default withNextra({
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  }
}); 