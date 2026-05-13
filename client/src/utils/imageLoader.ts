export function loadImage(src: string) {
    const image = new Image();

    image.src = src;

    return image;
}

export function loadImages(paths: Record<string, string>) {
    const images: Record<string, HTMLImageElement> = {};

    for (const key in paths) {
        images[key] = loadImage(paths[key]);
    }

    return images;
}