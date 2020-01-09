function replaceUrlParam(passedURL, paramName, paramValue) {
  let url = passedURL;

  if (paramValue == null) {
    paramValue = "";
  }
  const pattern = new RegExp(`\\b(${paramName}=).*?(&|#|$)`);
  if (url.search(pattern) >= 0) {
    return url.replace(pattern, `$1${paramValue}$2`);
  }
  url = url.replace(/[?#]$/, "");
  return `${url +
    (url.indexOf("?") > 0 ? "&" : "?") +
    paramName}=${paramValue}`;
}

export default replaceUrlParam;
