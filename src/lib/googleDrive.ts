import { ExtractedInvoiceData, extractInvoiceFromFile } from './invoiceReader';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  parents?: string[];
}

export const GOOGLE_OAUTH_CLIENT_ID =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID) ||
  '227689074337-67oh3tffhssp1a2anclo7b36hmnfu244.apps.googleusercontent.com';

export const GOOGLE_DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let driveToken: string | null = null;
let driveTokenExpiresAt = 0;
let driveTokenClient: any = null;

// Read token from sessionStorage on start
try {
  const savedToken = sessionStorage.getItem('gdrive_access_token');
  const savedExpiry = sessionStorage.getItem('gdrive_token_expiry');
  if (savedToken && savedExpiry && Date.now() < Number(savedExpiry)) {
    driveToken = savedToken;
    driveTokenExpiresAt = Number(savedExpiry);
  }
} catch (e) {
  // ignore
}

export function isGoogleDriveConnected(): boolean {
  return Boolean(driveToken && Date.now() < driveTokenExpiresAt);
}

export function getCachedDriveToken(): string | null {
  if (driveToken && Date.now() < driveTokenExpiresAt) {
    return driveToken;
  }
  return null;
}

export function disconnectGoogleDrive() {
  driveToken = null;
  driveTokenExpiresAt = 0;
  try {
    sessionStorage.removeItem('gdrive_access_token');
    sessionStorage.removeItem('gdrive_token_expiry');
  } catch (e) {
    // ignore
  }
}

/**
 * Initiates Google OAuth popup for Google Drive access
 */
export function requestGoogleDriveAuth(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      reject(
        new Error(
          'Google Identity Services ainda não foi carregado. Verifique sua conexão e tente novamente.'
        )
      );
      return;
    }

    try {
      driveTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        scope: GOOGLE_DRIVE_SCOPES,
        callback: (resp: any) => {
          if (resp.error) {
            console.error('Google Drive OAuth error:', resp);
            reject(new Error(resp.error_description || resp.error || 'Erro na autorização do Google Drive.'));
            return;
          }

          if (resp.access_token) {
            driveToken = resp.access_token;
            // expires_in in seconds (usually 3599s)
            const expiresInMs = (resp.expires_in ? Number(resp.expires_in) - 60 : 3500) * 1000;
            driveTokenExpiresAt = Date.now() + expiresInMs;

            try {
              sessionStorage.setItem('gdrive_access_token', driveToken);
              sessionStorage.setItem('gdrive_token_expiry', String(driveTokenExpiresAt));
            } catch (e) {
              // ignore
            }

            resolve(driveToken);
          } else {
            reject(new Error('Nenhum token retornado pelo Google.'));
          }
        },
        error_callback: (err: any) => {
          console.warn('OAuth GIS Drive error:', err);
          reject(new Error(err?.message || 'Falha ao autenticar com o Google Drive.'));
        },
      });

      // Prompt token request popup
      driveTokenClient.requestAccessToken({ prompt: '' });
    } catch (err: any) {
      reject(new Error(err?.message || 'Erro ao inicializar o login do Google Drive.'));
    }
  });
}

/**
 * Searches for a folder by name in Google Drive (e.g. 'nf-app')
 */
export async function findDriveFolder(
  folderName: string,
  token?: string
): Promise<{ id: string; name: string } | null> {
  const authToken = token || driveToken || (await requestGoogleDriveAuth());
  const query = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=5`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      disconnectGoogleDrive();
    }
    throw new Error(`Erro ao buscar pasta no Drive (${response.status})`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }
  return null;
}

/**
 * Lists PDF files in Google Drive.
 * Can filter by folderId or search term.
 */
export async function listDrivePdfFiles(options?: {
  folderId?: string | null;
  search?: string;
  token?: string;
}): Promise<DriveFile[]> {
  const authToken = options?.token || driveToken || (await requestGoogleDriveAuth());

  const queryParts = ["trashed = false"];

  if (options?.folderId) {
    queryParts.push(`'${options.folderId}' in parents`);
  } else {
    // If no specific folder, filter to PDF or images
    queryParts.push("(mimeType = 'application/pdf' or mimeType contains 'image/')");
  }

  if (options?.search && options.search.trim()) {
    const cleanSearch = options.search.replace(/'/g, "\\'").trim();
    queryParts.push(`name contains '${cleanSearch}'`);
  }

  const fullQuery = queryParts.join(' and ');
  const fields =
    'files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink,thumbnailLink,parents)';
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    fullQuery
  )}&fields=${encodeURIComponent(fields)}&orderBy=modifiedTime desc&pageSize=50`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      disconnectGoogleDrive();
    }
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ${response.status} ao listar arquivos do Google Drive.`);
  }

  const data = await response.json();
  return (data.files || []) as DriveFile[];
}

/**
 * Downloads a file from Google Drive as a browser File instance
 */
export async function downloadDriveFile(
  fileId: string,
  fileName: string,
  token?: string
): Promise<File> {
  const authToken = token || driveToken || (await requestGoogleDriveAuth());
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar arquivo do Google Drive (${response.status}).`);
  }

  const blob = await response.blob();
  const file = new File([blob], fileName, {
    type: blob.type || 'application/pdf',
  });
  return file;
}

/**
 * Downloads and reads an invoice directly from Google Drive
 */
export async function importInvoiceFromDrive(
  driveFile: DriveFile,
  token?: string
): Promise<{
  invoiceData: ExtractedInvoiceData;
  file: File;
}> {
  const file = await downloadDriveFile(driveFile.id, driveFile.name, token);
  const result = await extractInvoiceFromFile(file);

  // Attach Google Drive view link if available
  if (driveFile.webViewLink && result.data) {
    result.data.notes = result.data.notes
      ? `${result.data.notes} | Drive: ${driveFile.webViewLink}`
      : `Drive: ${driveFile.webViewLink}`;
  }

  return {
    invoiceData: result.data,
    file,
  };
}
