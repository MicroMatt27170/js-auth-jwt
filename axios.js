import axios from "axios";
import auth from "./auth";

export default () => {
    axios.defaults.headers.post["Content-Type"] = 'application/json'
  
  axios.interceptors.response.use(res => res, async (error) => {
  
    if (error.config && error.response && error.response.status === 401) {
      auth.refreshToken()
  
      error.config.headers.Authorization = 'Bearer ' + auth.accessToken
      return axios.request(error.config)
    }
  
    if (error.config && error.response && error.response.status === 403) {
        auth.logout()
        auth.redirectToAuthentication()
    }
  
    return Promise.reject(error)
  });
}
  