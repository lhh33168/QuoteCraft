type DownloadedFile = {
  fileName: string;
  blob: Blob;
};

function getFileNameFromDisposition(disposition: string | null, fallbackFileName: string) {
  if (!disposition) {
    return fallbackFileName;
  }

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = disposition.match(/filename=\"([^\"]+)\"/i);

  if (basicMatch?.[1]) {
    return basicMatch[1];
  }

  return fallbackFileName;
}

async function extractDownloadedFile(response: Response, fallbackFileName: string): Promise<DownloadedFile> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok || contentType.includes("application/json")) {
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    throw new Error(data.error ?? "File download failed.");
  }

  const blob = await response.blob();
  const fileName = getFileNameFromDisposition(response.headers.get("content-disposition"), fallbackFileName);

  return {
    blob,
    fileName
  };
}

function triggerBrowserDownload(file: DownloadedFile) {
  const objectUrl = window.URL.createObjectURL(file.blob);
  const link = window.document.createElement("a");

  link.href = objectUrl;
  link.download = file.fileName;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

async function tryNativeShare(file: DownloadedFile, shareTitle?: string) {
  if (typeof window === "undefined" || typeof navigator === "undefined" || typeof File === "undefined") {
    return false;
  }

  if (!("share" in navigator) || !("canShare" in navigator)) {
    return false;
  }

  const nativeFile = new File([file.blob], file.fileName, {
    type: file.blob.type || "application/pdf"
  });

  const sharePayload = {
    files: [nativeFile],
    title: shareTitle ?? file.fileName
  };

  try {
    if (!navigator.canShare?.(sharePayload)) {
      return false;
    }

    await navigator.share(sharePayload);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return true;
    }

    return false;
  }
}

export async function downloadFileFromResponse(
  response: Response,
  fallbackFileName: string,
  options?: {
    preferShare?: boolean;
    shareTitle?: string;
  }
) {
  const file = await extractDownloadedFile(response, fallbackFileName);
  const shared = options?.preferShare ? await tryNativeShare(file, options.shareTitle) : false;

  if (!shared) {
    triggerBrowserDownload(file);
  }

  return {
    fileName: file.fileName,
    shared
  };
}
