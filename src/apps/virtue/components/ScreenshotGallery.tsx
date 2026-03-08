type ScreenshotGalleryProps = {
  screenshots: string[];
  appName: string;
};

export function ScreenshotGallery({ screenshots, appName }: ScreenshotGalleryProps) {
  if (screenshots.length === 0) return null;

  return (
    <section className="virtue-screenshot-gallery" aria-label="App screenshots">
      {screenshots.map((src, index) => (
        <img key={`${src}-${index}`} src={src} alt={`${appName} screenshot ${index + 1}`} loading="lazy" />
      ))}
    </section>
  );
}
