
/*
 * Uploads property images directly to Cloudinary using backend-generated signatures.
 * Only image URLs and public IDs are returned to the property form.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, map } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { PropertyImage } from '../../../core/models/models';

interface SignatureResponse {
  success: boolean;
  data: {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    folder: string;
    signature: string;
  };
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  uploadImage(file: File): Observable<PropertyImage> {
    // Request a signed upload policy from the backend (API key, timestamp, signature, etc.).
    return this.api.post<SignatureResponse>(
      '/properties/image-signature',
      {}
    ).pipe(
      switchMap(response => {
        const signatureData = response.data;

        if (
          !signatureData?.cloudName ||
          !signatureData.apiKey ||
          !signatureData.signature ||
          !signatureData.timestamp ||
          !signatureData.folder
        ) {
          throw new Error('Invalid Cloudinary signature response.');
        }

        const formData = new FormData();

        formData.append('file', file);
        formData.append('api_key', signatureData.apiKey);
        formData.append('timestamp', String(signatureData.timestamp));
        formData.append('folder', signatureData.folder);
        formData.append('signature', signatureData.signature);

        const uploadUrl =
          `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`;

        // POST the image directly to Cloudinary using the signed credentials.
        return this.http.post<CloudinaryUploadResponse>(
          uploadUrl,
          formData
        ).pipe(
          map(response => {
            if (!response.secure_url || !response.public_id) {
              throw new Error('Cloudinary did not return image details.');
            }

            return {
              imageUrl: response.secure_url,
              publicId: response.public_id
            };
          })
);
      })
    );
  }
}
