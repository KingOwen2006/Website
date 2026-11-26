import {wrap} from '../_lib/http.js'
import {handleLogin} from '../_lib/auth.js'

export default wrap(handleLogin)
