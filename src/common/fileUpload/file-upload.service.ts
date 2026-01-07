import { Injectable } from '@nestjs/common';
import ImageKit from 'imagekit';
import sharp from 'sharp';

@Injectable()
export class FileUploadService {
  private imagekit: ImageKit;

  constructor() {
    this.imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
    });
  }

  async uploadImage(file: Express.Multer.File ,folder?: string, quality?: number): Promise<string> {
    try {
      const fileType = file.mimetype.split('/')[1].toLowerCase();
      let processedBuffer: Buffer;

      if (['jpg', 'png', 'jpeg'].includes(fileType) && quality && quality > 0 && quality < 100) {
        processedBuffer = await sharp(file.buffer)
          .rotate()
          .jpeg({
            quality: 80,
            progressive: true,
            optimizeScans: true,
            chromaSubsampling: '4:2:0',
            mozjpeg: true,
          })
          .toBuffer();
      } else {
        processedBuffer = file.buffer;
      }

      const uploadResponse = await this.imagekit.upload({
        file: processedBuffer,
        fileName: `${Date.now()}.${fileType}`,
        folder: folder || '/school-bell',
      });

      return uploadResponse.filePath;
    } catch (error) {
      console.error('ImageKit upload error:', error);
      throw error;
    }
  }

  async uploadImages(images: string[]): Promise<string[]> {
    const uploadPromises = images.map(async (imageUrl) => {
      const response = await fetch(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      const uploadResponse = await this.imagekit.upload({
        file: buffer,
        fileName: `product_${Date.now()}.jpg`,
        folder: '/products',
      });

      return uploadResponse.url;
    });

    return Promise.all(uploadPromises);
  }

  async uploadBuffer(buffer: Buffer): Promise<string> {
    try {
      const uploadResponse = await this.imagekit.upload({
        file: buffer,
        fileName: `buffer_${Date.now()}.jpg`,
        folder: '/products',
      });

      return uploadResponse.url;
    } catch (error) {
      console.error('ImageKit uploadBuffer error:', error);
      throw error;
    }
  }
}
