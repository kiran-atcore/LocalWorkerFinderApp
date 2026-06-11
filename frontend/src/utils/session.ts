import CookieManager from '@react-native-cookies/cookies';

export const getCsrfToken = async (url: string) => {
  const cookies = await CookieManager.get(url);
  if (cookies && cookies.csrftoken) {
    return cookies.csrftoken.value;
  }
  return null;
};