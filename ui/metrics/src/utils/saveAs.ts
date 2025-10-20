const isMacOSWebView =
  window.navigator &&
  /Macintosh/.test(navigator.userAgent) &&
  /AppleWebKit/.test(navigator.userAgent) &&
  !/Safari/.test(navigator.userAgent);
const global = window;

export default function saveAs(blob: Blob, name: string) {
  const hasDownload = "download" in HTMLAnchorElement.prototype && !isMacOSWebView;
  if (hasDownload) {
    const URL = window.URL || window.webkitURL;
    const a = document.createElementNS("http://www.w3.org/1999/xhtml", "a") as HTMLAnchorElement;
    a.download = name;
    a.rel = "noopener";
    a.href = URL.createObjectURL(blob);
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 4e4); // 40s
    setTimeout(function () {
      a.dispatchEvent(new MouseEvent("click"));
    }, 0);
  } else {
    // Fallback to using FileReader and a popup
    let popup = open("", "_blank");
    if (popup) {
      popup.document.title = popup.document.body.innerText = "downloading...";
    }

    const force = blob.type === "application/octet-stream";
    const isSafari = "safari" in global;
    const isChromeIOS = /CriOS\/[\d]+/.test(navigator.userAgent);

    if (
      (isChromeIOS || (force && isSafari) || isMacOSWebView) &&
      typeof FileReader !== "undefined"
    ) {
      // Safari doesn't allow downloading of blob URLs
      const reader = new FileReader();
      reader.onloadend = function () {
        let url = reader.result as string;
        url = isChromeIOS ? url : url.replace(/^data:[^;]*;/, "data:attachment/file;");
        if (popup) {
          popup.location.href = url;
        }
        popup = null;
      };
      reader.readAsDataURL(blob);
    } else {
      const URL = global.URL || global.webkitURL;
      const url = URL.createObjectURL(blob);
      if (popup) popup.location = url;
      else location.href = url;
      popup = null;
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 4e4); // 40s
    }
  }
}
