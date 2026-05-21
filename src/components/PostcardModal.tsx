import React, { useMemo, useState } from 'react';

type ProvinceContent = {
  name: string;
  arch: string;
  subtitle: string;
  card: string;
};

type PostcardModalProps = {
  provinceId: string;
  content: ProvinceContent;
  photoUrl: string;
  onClose: () => void;
};

const CARD_RATIO = 3 / 2;

function trimText(text: string, maxLength: number) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);

  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const characters = Array.from(text);
  const lines: string[] = [];
  let line = '';

  characters.forEach((char) => {
    const nextLine = `${line}${char}`;
    if (ctx.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = nextLine;
    }
  });

  if (line) lines.push(line);

  lines.slice(0, maxLines).forEach((lineText, index) => {
    const suffix = index === maxLines - 1 && lines.length > maxLines ? '...' : '';
    ctx.fillText(`${lineText}${suffix}`, x, y + index * lineHeight);
  });
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const imageRatio = image.width / image.height;
  const boxRatio = width / height;
  let sourceWidth = image.width;
  let sourceHeight = image.height;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > boxRatio) {
    sourceWidth = image.height * boxRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / boxRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawFallbackPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  arch: string
) {
  const sky = ctx.createLinearGradient(x, y, x + width, y + height);
  sky.addColorStop(0, '#d9c7a4');
  sky.addColorStop(0.46, '#879f94');
  sky.addColorStop(1, '#334842');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = 'rgba(255, 247, 224, 0.45)';
  for (let i = 0; i < 9; i += 1) {
    const peakX = x + width * (0.08 + i * 0.11);
    const peakHeight = height * (0.24 + (i % 3) * 0.08);
    ctx.beginPath();
    ctx.moveTo(peakX - width * 0.09, y + height * 0.72);
    ctx.lineTo(peakX, y + height * 0.72 - peakHeight);
    ctx.lineTo(peakX + width * 0.1, y + height * 0.72);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255, 251, 240, 0.88)';
  ctx.font = '28px serif';
  ctx.textAlign = 'center';
  ctx.fillText(arch, x + width / 2, y + height * 0.52);
  ctx.textAlign = 'left';
}

function drawFront(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  content: ProvinceContent,
  image: HTMLImageElement | null
) {
  ctx.save();
  ctx.shadowColor = 'rgba(31, 23, 15, 0.24)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#fffaf0';
  drawRoundedRect(ctx, x, y, width, height, 4);
  ctx.fill();
  ctx.restore();

  const padding = width * 0.035;
  const captionHeight = height * 0.15;
  const photoX = x + padding;
  const photoY = y + padding;
  const photoWidth = width - padding * 2;
  const photoHeight = height - padding * 2 - captionHeight;

  ctx.save();
  drawRoundedRect(ctx, photoX, photoY, photoWidth, photoHeight, 2);
  ctx.clip();
  if (image) {
    drawImageCover(ctx, image, photoX, photoY, photoWidth, photoHeight);
    ctx.fillStyle = 'rgba(238, 206, 145, 0.18)';
    ctx.fillRect(photoX, photoY, photoWidth, photoHeight);
    ctx.fillStyle = 'rgba(24, 20, 16, 0.16)';
    ctx.fillRect(photoX, photoY, photoWidth, photoHeight);
  } else {
    drawFallbackPhoto(ctx, photoX, photoY, photoWidth, photoHeight, content.arch);
  }
  ctx.restore();

  ctx.fillStyle = '#4d4034';
  ctx.font = '24px KaiTi, STKaiti, serif';
  wrapText(
    ctx,
    trimText(content.subtitle || content.card, 68),
    x + padding,
    y + height - captionHeight * 0.52,
    width - padding * 2,
    30,
    2
  );

  ctx.save();
  ctx.fillStyle = 'rgba(255, 250, 240, 0.18)';
  ctx.strokeStyle = 'rgba(255, 250, 240, 0.62)';
  ctx.lineWidth = 2;
  const tagX = x + width - padding - 44;
  const tagY = y + padding + 22;
  ctx.strokeRect(tagX, tagY, 34, 148);
  ctx.font = '22px KaiTi, STKaiti, serif';
  ctx.fillStyle = '#fffaf0';
  Array.from(`${content.name}${content.arch}`).slice(0, 8).forEach((char, index) => {
    ctx.fillText(char, tagX + 8, tagY + 28 + index * 17);
  });
  ctx.restore();
}

function drawBack(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  ctx.save();
  ctx.shadowColor = 'rgba(31, 23, 15, 0.18)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = '#fffaf0';
  drawRoundedRect(ctx, x, y, width, height, 4);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(92, 80, 65, 0.38)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + width * 0.52, y + height * 0.15);
  ctx.lineTo(x + width * 0.52, y + height * 0.84);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(92, 80, 65, 0.34)';
  for (let i = 0; i < 5; i += 1) {
    const lineY = y + height * (0.58 + i * 0.075);
    ctx.beginPath();
    ctx.moveTo(x + width * 0.62, lineY);
    ctx.lineTo(x + width * 0.9, lineY);
    ctx.stroke();
  }

  for (let i = 0; i < 6; i += 1) {
    ctx.strokeRect(x + width * (0.09 + i * 0.055), y + height * 0.24, width * 0.038, height * 0.056);
  }

  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = 'rgba(92, 80, 65, 0.48)';
  ctx.strokeRect(x + width * 0.78, y + height * 0.13, width * 0.12, height * 0.18);
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(92, 80, 65, 0.52)';
  ctx.font = '24px Georgia, serif';
  ctx.textAlign = 'center';
  ['BEST', 'WISHES', 'FOR', 'YOU'].forEach((word, index) => {
    ctx.fillText(word, x + width * 0.47, y + height * (0.68 + index * 0.055));
  });
  ctx.font = '15px Georgia, serif';
  ctx.fillText('P O S T C A R D', x + width * 0.47, y + height * 0.91);
  ctx.textAlign = 'left';
}

async function createPostcardImage(content: ProvinceContent, photoUrl: string, provinceId: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1800;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const image = await loadImage(photoUrl);
  const background = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  background.addColorStop(0, '#263b36');
  background.addColorStop(0.55, '#ece0cb');
  background.addColorStop(1, '#6b817d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.lineWidth = 16;
  for (let i = -2; i < 7; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 310, -30);
    ctx.lineTo(i * 310 + 640, 1230);
    ctx.stroke();
  }
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-40, i * 240 + 70);
    ctx.lineTo(1840, i * 240 - 120);
    ctx.stroke();
  }

  drawFront(ctx, 80, 330, 780, 520, content, image);
  drawBack(ctx, 940, 330, 780, 520);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${provinceId}-postcard.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export default function PostcardModal({ provinceId, content, photoUrl, onClose }: PostcardModalProps) {
  const [saving, setSaving] = useState(false);
  const caption = useMemo(() => trimText(content.subtitle || content.card, 72), [content.card, content.subtitle]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    await createPostcardImage(content, photoUrl, provinceId);
    setSaving(false);
  };

  return (
    <div className="postcard-modal" role="dialog" aria-modal="true" aria-label="生成明信片">
      <div className="postcard-modal__panel">
        <button type="button" className="postcard-modal__close" onClick={onClose} aria-label="关闭">
          x
        </button>

        <div className="postcard-modal__head">
          <span className="postcard-modal__eyebrow">POSTCARD</span>
          <h2>生成明信片</h2>
        </div>

        <div className="postcard-preview">
          <article className="postcard-card postcard-card--front" style={{ aspectRatio: CARD_RATIO }}>
            <div className="postcard-card__photo">
              {photoUrl ? <img src={photoUrl} alt={`${content.arch} 明信片正面`} /> : <div className="postcard-card__fallback">{content.arch}</div>}
              <div className="postcard-card__vertical-label">
                <span>{content.name}</span>
                <span>{content.arch}</span>
              </div>
            </div>
            <p>{caption}</p>
          </article>

          <article className="postcard-card postcard-card--back" style={{ aspectRatio: CARD_RATIO }}>
            <div className="postcard-back__codes">
              {Array.from({ length: 6 }).map((_, index) => <span key={index} />)}
            </div>
            <div className="postcard-back__divider" />
            <div className="postcard-back__stamp" />
            <div className="postcard-back__lines">
              {Array.from({ length: 5 }).map((_, index) => <span key={index} />)}
            </div>
            <div className="postcard-back__wish">
              <span>BEST</span>
              <span>WISHES</span>
              <span>FOR</span>
              <span>YOU</span>
            </div>
            <div className="postcard-back__mark">P O S T C A R D</div>
          </article>
        </div>

        <div className="postcard-modal__actions">
          <button type="button" className="learn-btn learn-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? '正在生成...' : '保存明信片'}
          </button>
          <button type="button" className="learn-btn learn-btn--ghost" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
