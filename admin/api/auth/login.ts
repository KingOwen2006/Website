import {wrap} from '../_lib/http'
import {handleLogin} from '../_lib/auth'

export default wrap(handleLogin)
