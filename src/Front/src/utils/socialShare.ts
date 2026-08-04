export const shareOnFacebookLink = (url: string) => `https://www.facebook.com/sharer.php?u=${url}`;

export const shareOnX = (url: string, title?: string) => {
  const encodedTitle = title ? encodeURIComponent(title) : '';
  return `https://x.com/intent/tweet?url=${url}&text=${encodedTitle}`;
};

export const shareOnLinkedinLink = (url: string) => `https://www.linkedin.com/cws/share?url=${url}`;

export const shareOnEmailLink = (url: string) =>
  `mailto:?subject=I want to share this with you&body=Hi there check out this site ${url}`;

export const rssFeedLink = (url: string) =>
  `/api/rss/singleArticle?articlePath=${url}&utm_source=rss-feed`;
