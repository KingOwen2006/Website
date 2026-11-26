import {wrap} from '../../_lib/http.js'
import {handleUpload} from '../../_lib/handlers.js'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default wrap(handleUpload)
