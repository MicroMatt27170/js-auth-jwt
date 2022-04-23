import axios from "axios";
import auth from "./auth";

export default async (pluginAxios = null) => {
    let pAxios = pluginAxios !== null ? pluginAxios : axios

    pAxios.defaults.headers.post["Content-Type"] = 'application/json'

    pAxios.interceptors.response.use(res => res, async (error) => {
  
    if (error.config && error.response && error.response.status === 401) {
      await auth.refreshToken()
  
      error.config.headers.Authorization = 'Bearer ' + auth.accessToken
      return pAxios.request(error.config)
    }
  
    if (error.config && error.response && error.response.status === 403) {
        await auth.logout()
        auth.redirectToAuthentication()
    }
  
    return Promise.reject(error)
  });
}
  