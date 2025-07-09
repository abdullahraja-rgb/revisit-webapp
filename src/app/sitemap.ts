export default async function sitemap() {
  // Add your static pages
  const routes = [""].map((route) => ({
    url: `https://humant.vercel.app/${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "daily",
    priority: 1,
  }));

  return routes;
}
