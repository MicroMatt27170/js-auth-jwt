 import axios from 'axios'

export class auth {

    constructor() {
        this.isInit = false
        this.accessToken = null
        this.token = {
            createdAt: null,
            expirationAt: null,
        }
        this.user = {
            uuid: null,
            username: '',
            name: ''
        }
        this.services = []
        this.actions = []
    }

    initAuth(serverUrl, authUrl, serviceKey = null) {
        this.serverUrl = serverUrl
        this.authUrl = authUrl
        this.serviceKey = serviceKey
        this.isInit = true
    }

    getUser() {
        let x = {}
        Object.assign(x, this.user)
        return x
    }

    isAuthenticated() {
        return this.accessToken && this.accessToken !== ''
    }

    getBearerAuthToken() {
        return 'Bearer ' + this.accessToken
    }

    setUser(user) {
        this.user = user
    }

    setActions(actions) {
        this.actions = actions
    }

    setServices(services) {
        this.services = services
    }

    setPayload(accessToken, createdAt = null, expirationAt = null) {
        this.accessToken = accessToken

        if (createdAt) {
          try {
            this.token.createdAt = new Date(createdAt * 1000)
            this.token.expirationAt = new Date(expirationAt * 1000)
          } catch (e) {
            this.token.createdAt = null
            this.token.expirationAt = null
          }
        }

        if (accessToken) {
          localStorage.setItem('jwt', accessToken)
          axios.defaults.headers.common.Authorization = 'Bearer ' + accessToken
        } else {
          localStorage.removeItem('jwt')
          delete axios.defaults.headers.common.Authorization 
        }
    }

    async logout() {
        let accessToken = state.accessToken

        await axios.post(this.authUrl+'/api/auth/logout',
        { access_token: accessToken }).then(res => {
          // commit(AUTH_MUTATIONS.LOGOUT)
          localStorage.removeItem('jwt')
          window.location.replace(this.authUrl)
        })
    }



    isValidToken(token) {
      try {
        const jwt = token.split('.')
        if (jwt.length !== 3) return false;
    
        JSON.parse(atob(jwt[0]))
        JSON.parse(atob(jwt[1]))
    
    
        localStorage.setItem('jwt', token)
        return true;
      }catch (e) {
        return false;
      }
    }
    
    redirectToAuthentication() {
      const localUrl = window.location.href
      const urlSearchParams = {
        continueTo: localUrl,
        service: (this.serviceKey || '')
      }
    
      const url = this.authUrl  +'/login/?'+ (new URLSearchParams(urlSearchParams))
      window.location.replace(url);
    }

    requestLogin() {
      let _this = this
      let containsLocalStorageJWT = function() {
        const token = localStorage.getItem('jwt')
        _this.setPayload(token)
      
        let ext = _this.token.expirationAt
      
          if (ext) {
            ext = new Date(ext.getTime())
            ext = ext.setMinutes(ext.getMinutes() - 15)
            let today = new Date()
            today = today.getTime()
      
            if (today > ext) {
              _this.refreshToken()
            }
      
          } else {
            _this.refreshToken()
          }
      }

      let containsAccessTokenQueryJWT = function () {
        const routeQuery = new URLSearchParams(window.location.search)
        if (!_this.isValidToken(routeQuery.get('access_token'))) {
          if (localStorage.getItem('jwt')) {
            containsLocalStorageJWT();
          } else {
            _this.redirectToAuthentication()
          }
        } else {
          const token = routeQuery.get('access_token')
          _this.setPayload(token)

          _this.refreshToken()
      
          routeQuery.delete('access_token')
          window.location.search = routeQuery.toString()
        }
      }

      const routeQuery = new URLSearchParams(window.location.search)


      if (routeQuery.get('access_token')) {
        containsAccessTokenQueryJWT();
      }
      else if (localStorage.getItem('jwt')) {
        containsLocalStorageJWT();
      } else {
        this.redirectToAuthentication()
      }

    }

    async refreshToken() {
        let accessToken = this.accessToken

        // make an API call using the refresh token to generate a new access token
        await axios.post(this.authUrl+'/api/auth/refresh',
        { access_token: accessToken }).then(res => {
            this.setPayload(res.data.access_token,
                res.data.created_at,
                res.data.expiration_at)

            this.setUser(res.data.user)
            this.setServices(res.data.services)
            this.setActions(res.data.actions)

        })
    }
}


export default new auth()